#!/usr/bin/env node
/*
 * Resets the app to a blank starting point.
 *   yarn reset-project            moves app/ and src/ into app-example/
 *   yarn reset-project --delete   deletes app/ and src/ instead
 * A new, empty app/ (index + layout) is created either way.
 */
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const targets = ["app", "src"];
const exampleDir = path.join(root, "app-example");
const shouldDelete = process.argv.includes("--delete");

const indexContent = `import { Text, View } from "react-native";

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}
`;

const layoutContent = `import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
`;

function main() {
  if (!shouldDelete && fs.existsSync(exampleDir)) {
    console.error("app-example/ already exists. Remove or rename it first, then run this again.");
    process.exit(1);
  }

  if (!shouldDelete) fs.mkdirSync(exampleDir);

  for (const name of targets) {
    const source = path.join(root, name);
    if (!fs.existsSync(source)) continue;

    if (shouldDelete) {
      fs.rmSync(source, { recursive: true, force: true });
      console.log(`Deleted ${name}/`);
    } else {
      fs.renameSync(source, path.join(exampleDir, name));
      console.log(`Moved ${name}/ to app-example/${name}/`);
    }
  }

  fs.mkdirSync(path.join(root, "app"));
  fs.writeFileSync(path.join(root, "app", "index.tsx"), indexContent);
  fs.writeFileSync(path.join(root, "app", "_layout.tsx"), layoutContent);
  console.log("Created a blank app/ with index.tsx and _layout.tsx.");
}

main();
