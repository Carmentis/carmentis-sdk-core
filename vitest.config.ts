import { defineConfig } from "vitest/config";
import {playwright} from "@vitest/browser-playwright";

export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    name: "node",
                    environment: "node",
                    include: [
                        "**/unit/**/*.spec.ts",
                    ],
                    exclude: [
                        "**/local/*.spec.ts",
                    ],
                }
            },
            {
                test: {
                    name: "browser",
                    browser: {
                        enabled: true,
                        provider: playwright(),
                        instances: [
                            { browser: 'chromium' },
                        ],
                    },

                    include: [
                        "**/unit/**/*cbor.spec.ts",
                    ],
                    exclude: [
                        "**/local/*.spec.ts",
                    ],
                }
            }
        ]

    },
});
