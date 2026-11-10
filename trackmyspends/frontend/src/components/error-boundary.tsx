import { Component, ErrorInfo, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { makeStyles } from "@/src/theme";

const useStyles = makeStyles((colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  title: { color: colors.onSurface, fontSize: 22, fontWeight: "800", textAlign: "center" },
  message: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center" },
  button: { minHeight: 48, minWidth: 160, borderRadius: 14, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, marginTop: 8 },
  buttonText: { color: colors.onBrandPrimary, fontSize: 16, fontWeight: "800" },
}));

function Fallback({ onRetry }: { onRetry: () => void }) {
  const styles = useStyles();
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>Your expenses are saved on this device. Please try again.</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Try again"
        onPress={onRetry}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}
      >
        <Text style={styles.buttonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

type Props = { children: ReactNode };
type State = { hasError: boolean };

// App level boundary: a render crash shows this screen instead of a blank app.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    return this.state.hasError ? <Fallback onRetry={this.reset} /> : this.props.children;
  }
}
