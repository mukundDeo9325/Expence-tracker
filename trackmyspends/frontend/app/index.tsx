import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CATEGORIES, Category, Expense, loadExpenses, saveExpenses } from "@/src/expenses";
import { makeStyles, useTheme } from "@/src/theme";

const BUDGET = 15000;
const categoryIcons: Record<Category, keyof typeof Ionicons.glyphMap> = {
  Groceries: "basket-outline",
  Fuel: "car-outline",
  Electricity: "flash-outline",
  "Eating out": "restaurant-outline",
  Recharge: "phone-portrait-outline",
};

function formatMoney(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function isSameMonth(date: Date, reference: Date) {
  return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
}

function isToday(date: Date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 20, gap: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  eyebrow: { color: colors.brandPrimary, fontSize: 13, fontWeight: "700", letterSpacing: 0.5, marginBottom: 6 },
  title: { color: colors.onSurface, fontSize: 30, fontWeight: "800", letterSpacing: -0.8 },
  monthBadge: { backgroundColor: colors.brandTertiary, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, marginTop: 4 },
  monthText: { color: colors.onBrandTertiary, fontSize: 12, fontWeight: "700" },
  budgetCard: { backgroundColor: colors.brandPrimary, borderRadius: 20, padding: 20, gap: 18 },
  budgetTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardLabel: { color: colors.onBrandPrimary, opacity: 0.8, fontSize: 13, fontWeight: "600" },
  budgetValue: { color: colors.onBrandPrimary, fontSize: 28, fontWeight: "800", marginTop: 6 },
  budgetLeft: { color: colors.onBrandPrimary, fontSize: 13, fontWeight: "700", textAlign: "right", marginTop: 4 },
  progressTrack: { height: 8, backgroundColor: colors.brand, borderRadius: 99, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.onBrandPrimary, borderRadius: 99 },
  budgetFooter: { flexDirection: "row", justifyContent: "space-between" },
  budgetHint: { color: colors.onBrandPrimary, opacity: 0.82, fontSize: 12 },
  summaryRow: { flexDirection: "row", gap: 12 },
  summaryCard: { flex: 1, backgroundColor: colors.surfaceSecondary, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16, minHeight: 106, justifyContent: "space-between" },
  summaryLabel: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  summaryValue: { color: colors.onSurface, fontSize: 21, fontWeight: "800" },
  sectionTitle: { color: colors.onSurface, fontSize: 20, fontWeight: "800", marginBottom: 14 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: 18, padding: 18, borderColor: colors.border, borderWidth: 1 },
  chartRow: { marginBottom: 15, gap: 8 },
  chartMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  categoryName: { color: colors.onSurfaceSecondary, fontSize: 14, fontWeight: "600" },
  categoryAmount: { color: colors.onSurface, fontSize: 14, fontWeight: "800" },
  barTrack: { height: 9, backgroundColor: colors.surfaceTertiary, borderRadius: 99, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: colors.brandSecondary, borderRadius: 99 },
  emptyText: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  emptyAction: { alignSelf: "flex-start", marginTop: 16, minHeight: 44, justifyContent: "center", paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.brandTertiary },
  emptyActionText: { color: colors.onBrandTertiary, fontWeight: "800", fontSize: 14 },
  expenseRow: { flexDirection: "row", alignItems: "center", paddingVertical: 13, borderBottomColor: colors.divider, borderBottomWidth: 1, gap: 12 },
  iconBox: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  expenseMain: { flex: 1, gap: 3 },
  expenseCategory: { color: colors.onSurface, fontSize: 15, fontWeight: "700" },
  expenseNote: { color: colors.muted, fontSize: 12 },
  expenseDate: { color: colors.muted, fontSize: 12 },
  expenseAmount: { color: colors.onSurface, fontSize: 15, fontWeight: "800" },
  deleteButton: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  fab: { position: "absolute", right: 20, width: 58, height: 58, borderRadius: 29, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center", shadowColor: colors.surfaceInverse, shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(33,37,41,0.35)" },
  sheet: { backgroundColor: colors.surfaceSecondary, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, gap: 18 },
  handle: { width: 42, height: 5, backgroundColor: colors.borderStrong, borderRadius: 99, alignSelf: "center", marginBottom: 2 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sheetTitle: { color: colors.onSurface, fontSize: 23, fontWeight: "800" },
  closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  amountInput: { color: colors.onSurface, backgroundColor: colors.surfaceTertiary, borderRadius: 16, fontSize: 28, fontWeight: "800", paddingHorizontal: 16, paddingVertical: 16 },
  fieldLabel: { color: colors.onSurfaceSecondary, fontSize: 14, fontWeight: "800", marginBottom: 10 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryChip: { minHeight: 46, borderRadius: 14, borderColor: colors.border, borderWidth: 1, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 7 },
  selectedChip: { backgroundColor: colors.brandTertiary, borderColor: colors.brandSecondary },
  categoryChipText: { color: colors.onSurfaceSecondary, fontSize: 13, fontWeight: "700" },
  selectedChipText: { color: colors.onBrandTertiary },
  noteInput: { color: colors.onSurface, backgroundColor: colors.surfaceTertiary, borderRadius: 14, fontSize: 15, paddingHorizontal: 14, paddingVertical: 13, minHeight: 48 },
  saveButton: { minHeight: 54, borderRadius: 16, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center", marginTop: 2 },
  saveButtonText: { color: colors.onBrandPrimary, fontSize: 16, fontWeight: "800" },
  errorText: { color: colors.error, fontSize: 13, fontWeight: "600" },
}));

function SummaryCard({ label, amount }: { label: string; amount: string }) {
  const styles = useStyles();
  return <View style={styles.summaryCard}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{amount}</Text></View>;
}

export default function Index() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Groceries");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useFocusEffect(useCallback(() => {
    let active = true;
    loadExpenses().then((stored) => { if (active) setExpenses(stored.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));

  const now = new Date();
  const monthExpenses = expenses.filter((expense) => isSameMonth(new Date(expense.createdAt), now));
  const monthTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const todayTotal = monthExpenses.filter((expense) => isToday(new Date(expense.createdAt))).reduce((sum, expense) => sum + expense.amount, 0);
  const budgetLeft = Math.max(0, BUDGET - monthTotal);
  const progress = Math.min(monthTotal / BUDGET, 1);
  const categoryTotals = CATEGORIES.map((item) => ({ category: item, total: monthExpenses.filter((expense) => expense.category === item).reduce((sum, expense) => sum + expense.amount, 0) }));
  const maxCategoryTotal = Math.max(...categoryTotals.map((item) => item.total), 1);

  const resetForm = () => { setAmount(""); setCategory("Groceries"); setNote(""); setError(""); };
  const openSheet = () => { resetForm(); setSheetOpen(true); };
  const closeSheet = () => { setSheetOpen(false); resetForm(); };
  const addExpense = async () => {
    const parsedAmount = Number(amount.replace(/,/g, ""));
    if (!parsedAmount || parsedAmount <= 0) { setError("Enter an amount greater than zero."); return; }
    const nextExpense: Expense = { id: `${Date.now()}`, amount: parsedAmount, category, note: note.trim(), createdAt: new Date().toISOString() };
    const nextExpenses = [nextExpense, ...expenses];
    setExpenses(nextExpenses);
    await saveExpenses(nextExpenses);
    closeSheet();
  };
  const removeExpense = async (id: string) => {
    const nextExpenses = expenses.filter((expense) => expense.id !== id);
    setExpenses(nextExpenses);
    await saveExpenses(nextExpenses);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 96 }]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
          <View><Text style={styles.eyebrow}>YOUR MONEY, MADE SIMPLE</Text><Text style={styles.title}>TrackMySpends</Text></View>
          <View style={styles.monthBadge}><Text style={styles.monthText}>{now.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</Text></View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(450)} style={styles.budgetCard}>
          <View style={styles.budgetTop}><View><Text style={styles.cardLabel}>Monthly budget left</Text><Text style={styles.budgetValue}>{formatMoney(budgetLeft)}</Text></View><Text style={styles.budgetLeft}>{Math.round(progress * 100)}% used</Text></View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(progress * 100, 1)}%` }]} /></View>
          <View style={styles.budgetFooter}><Text style={styles.budgetHint}>Spent {formatMoney(monthTotal)}</Text><Text style={styles.budgetHint}>Limit {formatMoney(BUDGET)}</Text></View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(450)} style={styles.summaryRow}><SummaryCard label="Today" amount={formatMoney(todayTotal)} /><SummaryCard label="This month" amount={formatMoney(monthTotal)} /></Animated.View>

        <Animated.View entering={FadeInUp.delay(220).duration(450)}>
          <Text style={styles.sectionTitle}>Spending by category</Text>
          <View style={styles.card}>{loading ? <ActivityIndicator color={colors.brandPrimary} /> : monthTotal === 0 ? <Text style={styles.emptyText}>Your category chart will appear after your first expense.</Text> : categoryTotals.map((item) => <View key={item.category} style={styles.chartRow}><View style={styles.chartMeta}><Text style={styles.categoryName}>{item.category}</Text><Text style={styles.categoryAmount}>{formatMoney(item.total)}</Text></View><View style={styles.barTrack}><View style={[styles.barFill, { width: `${Math.max((item.total / maxCategoryTotal) * 100, item.total ? 4 : 0)}%` }]} /></View></View>)}</View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(280).duration(450)}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent expenses</Text>{expenses.length > 0 && <Text style={styles.expenseDate}>{expenses.length} total</Text>}</View>
          <View style={styles.card}>{loading ? <ActivityIndicator color={colors.brandPrimary} /> : expenses.length === 0 ? <><Text style={styles.emptyText}>No expenses logged yet.</Text><Pressable onPress={openSheet} style={({ pressed }) => [styles.emptyAction, pressed && { opacity: 0.75 }]}><Text style={styles.emptyActionText}>Add your first expense</Text></Pressable></> : expenses.slice(0, 8).map((expense) => <View key={expense.id} style={styles.expenseRow}><View style={styles.iconBox}><Ionicons name={categoryIcons[expense.category]} size={21} color={colors.brandPrimary} /></View><View style={styles.expenseMain}><Text style={styles.expenseCategory}>{expense.category}</Text><Text style={styles.expenseNote}>{expense.note || shortDate(expense.createdAt)}</Text></View><Text style={styles.expenseAmount}>{formatMoney(expense.amount)}</Text><Pressable accessibilityLabel={`Delete ${expense.category} expense`} onPress={() => removeExpense(expense.id)} style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.5 }]}><Ionicons name="trash-outline" size={18} color={colors.muted} /></Pressable></View>)}</View>
        </Animated.View>
      </ScrollView>

      <Pressable accessibilityLabel="Add expense" onPress={openSheet} style={({ pressed }) => [styles.fab, { bottom: insets.bottom + 20 }, pressed && { transform: [{ scale: 0.94 }], opacity: 0.9 }]}><Ionicons name="add" size={30} color={colors.onBrandPrimary} /></Pressable>

      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={closeSheet}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalBackdrop}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>Add expense</Text><Pressable accessibilityLabel="Close" onPress={closeSheet} style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}><Ionicons name="close" size={21} color={colors.onSurfaceSecondary} /></Pressable></View>
            <View><Text style={styles.fieldLabel}>Amount</Text><TextInput autoFocus keyboardType="decimal-pad" value={amount} onChangeText={(value) => { setAmount(value); setError(""); }} placeholder="₹ 0" placeholderTextColor={colors.muted} style={styles.amountInput} /></View>
            <View><Text style={styles.fieldLabel}>Category</Text><View style={styles.categoryGrid}>{CATEGORIES.map((item) => { const selected = item === category; return <Pressable key={item} onPress={() => setCategory(item)} style={({ pressed }) => [styles.categoryChip, selected && styles.selectedChip, pressed && { opacity: 0.75 }]}><Ionicons name={categoryIcons[item]} size={17} color={selected ? colors.onBrandTertiary : colors.onSurfaceSecondary} /><Text style={[styles.categoryChipText, selected && styles.selectedChipText]}>{item}</Text></Pressable>; })}</View></View>
            <View><Text style={styles.fieldLabel}>Note <Text style={{ color: colors.muted, fontWeight: "500" }}>(optional)</Text></Text><TextInput value={note} onChangeText={setNote} placeholder="What was it for?" placeholderTextColor={colors.muted} style={styles.noteInput} returnKeyType="done" /></View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Pressable onPress={addExpense} style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.8 }]}><Text style={styles.saveButtonText}>Save expense</Text></Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
