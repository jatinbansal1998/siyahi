// @ts-check
// Oxlint (and ESLint) plugin `siyahi`. Every rule runs only in files that
// import `@siyahi/ui`, so pages written before Siyahi stay outside the rules
// without any configuration. Three rules come from @shadcn/lint; the other
// four cover what it does not check. One more, optional-accepts-undefined, is
// for a component library's own types: unscoped, and not in `recommended`.
import { plugin as shadcn } from "@shadcn/lint";

/** @typedef {{ sourceCode: { text: string }, report: (problem: { node: unknown, message: string }) => void }} Context */
/** @typedef {{ meta?: object, create: (context: any) => Record<string, (node: any) => void> }} Rule */

const IMPORTS_SIYAHI = /(?:\bfrom\s*|\bimport\s*\(?\s*)["']@siyahi\/ui(?:\/[^"']*)?["']/;

/**
 * @param {Rule} rule
 * @returns {Rule}
 */
function scoped(rule) {
  return {
    ...rule,
    create: (context) => (IMPORTS_SIYAHI.test(context.sourceCode.text) ? rule.create(context) : {}),
  };
}

/**
 * Calls `check` with the text of every string literal and template chunk,
 * skipping import and export paths.
 * @param {(node: unknown, text: string) => void} check
 */
function eachString(check) {
  return {
    /** @param {{ value: unknown, parent?: { type: string } }} node */
    Literal(node) {
      const parent = node.parent?.type ?? "";
      if (typeof node.value !== "string" || /^(Import|Export)/.test(parent)) return;
      check(node, node.value);
    },
    /** @param {{ value: { cooked?: string | null, raw: string } }} node */
    TemplateElement(node) {
      check(node, node.value.cooked ?? node.value.raw);
    },
  };
}

const HEX = /(?:^|[^\w&#])#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})(?![\w-])/i;
const COLOR_FUNCTION = /\b(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch|color)\(/i;

/** @type {Rule} */
const noColorLiteral = {
  meta: {
    type: "problem",
    docs: { description: "Disallow hex, rgb(), hsl() and oklch() colour literals; use a theme token." },
  },
  create: (/** @type {Context} */ context) =>
    eachString((node, text) => {
      if (HEX.test(text) || COLOR_FUNCTION.test(text)) {
        context.report({
          node,
          message:
            "Colour literal. Use a theme token: a class such as text-positive or bg-card, or var(--chart-1) where a library needs a value.",
        });
      }
    }),
};

const SCHEME_VARIANT = /(?:^|[\s:])(dark|light):(?=[\w[!-])/;

/** @type {Rule} */
const noSchemeVariant = {
  meta: {
    type: "problem",
    docs: { description: "Disallow dark: and light: variants; theme tokens already change with the scheme." },
  },
  create: (/** @type {Context} */ context) =>
    eachString((node, text) => {
      const m = SCHEME_VARIANT.exec(text);
      if (m) {
        context.report({
          node,
          message: `"${m[1]}:" variant. Theme tokens follow the device's scheme on their own; use the token, not a per-scheme class.`,
        });
      }
    }),
};

/**
 * @param {{ type: string, value?: unknown, expression?: { type: string, value?: unknown } } | null | undefined} value
 */
function isNumericSize(value) {
  const literal = value?.type === "JSXExpressionContainer" ? value.expression : value;
  if (literal?.type !== "Literal") return false;
  return typeof literal.value === "number" || (typeof literal.value === "string" && /^\d/.test(literal.value));
}

/** @type {Rule} */
const noNumericFontSize = {
  meta: {
    type: "problem",
    docs: { description: "Disallow numeric font sizes; use the type scale (text-xs to text-2xl)." },
  },
  create: (/** @type {Context} */ context) => {
    const message = "Numeric font size. Use the type scale: a text-xs to text-2xl class on the element.";
    return {
      /** @param {{ key: { type: string, name?: string, value?: unknown }, value: any }} node */
      Property(node) {
        const key = node.key.type === "Identifier" ? node.key.name : node.key.value;
        if (key === "fontSize" && isNumericSize(node.value)) context.report({ node, message });
      },
      /** @param {{ name: { name?: string }, value: any }} node */
      JSXAttribute(node) {
        if (node.name.name === "fontSize" && isNumericSize(node.value)) context.report({ node, message });
      },
    };
  },
};

/** @type {Rule} */
const noChartThemeMap = {
  meta: {
    type: "problem",
    docs: { description: "Disallow per-scheme ChartConfig theme maps; use color: var(--chart-n)." },
  },
  // shadcn's ChartStyle writes a theme map's dark entry under a `.dark` class,
  // which Siyahi never sets, so the light entry would win in dark mode.
  create: (/** @type {Context} */ context) => ({
    /** @param {{ key: { type: string, name?: string, value?: unknown }, value: { type: string, properties?: { key?: { name?: string, value?: unknown } }[] } }} node */
    Property(node) {
      const key = node.key.type === "Identifier" ? node.key.name : node.key.value;
      if (key !== "theme" || node.value.type !== "ObjectExpression") return;
      const keys = new Set((node.value.properties ?? []).map((p) => p.key?.name ?? p.key?.value));
      if (keys.has("light") || keys.has("dark")) {
        context.report({
          node,
          message:
            'Chart theme map. Its dark entry only applies under a .dark class, which Siyahi never sets. Use color: "var(--chart-1)"; the variable already follows the scheme.',
        });
      }
    },
  }),
};

/** Types that already hold undefined, so they need no `| undefined`. */
const HOLDS_UNDEFINED = new Set(["TSUndefinedKeyword", "TSAnyKeyword", "TSUnknownKeyword", "TSVoidKeyword"]);
/** Types that bind looser than `|`, so a union with undefined wraps them in brackets. */
const LOOSE = new Set(["TSFunctionType", "TSConstructorType", "TSConditionalType"]);

/**
 * @param {{ type: string, types?: { type: string }[], typeName?: { type: string, name?: string, right?: { name?: string } } }} type
 * @returns {boolean}
 */
function holdsUndefined(type) {
  if (HOLDS_UNDEFINED.has(type.type)) return true;
  if (type.type === "TSUnionType") return (type.types ?? []).some(holdsUndefined);
  // React's ReactNode includes undefined.
  const name = type.typeName?.type === "TSQualifiedName" ? type.typeName.right?.name : type.typeName?.name;
  return type.type === "TSTypeReference" && name === "ReactNode";
}

/**
 * Whether a node sits in the pattern a conditional type matches against, `T extends { x?: infer U } ? U : never`,
 * where adding undefined would change what matches and what `infer` takes.
 * @param {any} node
 * @returns {boolean}
 */
function inPattern(node) {
  for (let child = node; child.parent; child = child.parent) {
    if (child.parent.type === "TSConditionalType" && child.parent.extendsType === child) return true;
  }
  return false;
}

/** @type {Rule} */
const optionalAcceptsUndefined = {
  meta: {
    type: "problem",
    fixable: "code",
    docs: { description: "Require `| undefined` on an optional property, for pages under exactOptionalPropertyTypes." },
  },
  // Under exactOptionalPropertyTypes, `tone?: Tone` rejects `tone: loss ? "negative" : undefined`, the way a page
  // writes a prop it sets only sometimes; `tone?: Tone | undefined` takes it.
  create: (context) => {
    const message =
      "An optional property must also accept undefined: add `| undefined`, for pages under exactOptionalPropertyTypes.";
    /**
     * @param {any} node a property signature, class field or mapped type
     * @param {any} type its type
     */
    function check(node, type) {
      if (!type || holdsUndefined(type) || inPattern(node)) return;
      context.report({
        node,
        message,
        fix: (/** @type {any} */ fixer) =>
          LOOSE.has(type.type)
            ? [fixer.insertTextBefore(type, "("), fixer.insertTextAfter(type, ") | undefined")]
            : fixer.insertTextAfter(type, " | undefined"),
      });
    }
    return {
      /** @param {any} node */
      TSPropertySignature(node) {
        if (node.optional) check(node, node.typeAnnotation?.typeAnnotation);
      },
      /** @param {any} node */
      PropertyDefinition(node) {
        if (node.optional) check(node, node.typeAnnotation?.typeAnnotation);
      },
      /** @param {any} node `[K in keyof T]?: T[K]` */
      TSMappedType(node) {
        if (node.optional === true || node.optional === "+") check(node, node.typeAnnotation);
      },
      /** @param {any} node `onSelect?(): void`, which has no type to add undefined to */
      TSMethodSignature(node) {
        if (!node.optional || inPattern(node)) return;
        context.report({
          node,
          message: `${message} Write it as a property: \`onSelect?: (() => void) | undefined\`.`,
        });
      },
    };
  },
};

/**
 * Options for shadcn's no-restyle, so every app gets the same policy from
 * `"siyahi/no-restyle": "error"` alone. Pages may place a component (margin,
 * width, grid and flex placement); its spacing, colour, shape and type stay
 * the component's. Primitives with no styles of their own are open.
 */
const RESTYLE = {
  allow: ["layout"],
  contracts: [{ pattern: "^(Collapsible|CollapsibleContent)$", allow: ["layout", "spacing"] }],
};

/**
 * Runs `rule` with `options` unless the config passes its own.
 * @param {Rule} rule
 * @param {object} options
 * @returns {Rule}
 */
function withOptions(rule, options) {
  return {
    ...rule,
    create: (context) =>
      rule.create(context.options?.length ? context : Object.create(context, { options: { value: [options] } })),
  };
}

/** Rules for pages that use Siyahi. */
const pageRules = {
  "no-color-literal": scoped(noColorLiteral),
  "no-scheme-variant": scoped(noSchemeVariant),
  "no-numeric-font-size": scoped(noNumericFontSize),
  "no-chart-theme-map": scoped(noChartThemeMap),
  "no-raw-colors": scoped(shadcn.rules["no-raw-colors"]),
  "no-arbitrary-values": scoped(shadcn.rules["no-arbitrary-values"]),
  "no-restyle": scoped(withOptions(shadcn.rules["no-restyle"], RESTYLE)),
};

/** @type {{ meta: { name: string }, rules: Record<string, Rule> }} */
const plugin = {
  meta: { name: "siyahi" },
  // optional-accepts-undefined is for a component library's own types, not for pages, which only use them.
  rules: { ...pageRules, "optional-accepts-undefined": optionalAcceptsUndefined },
};

/**
 * Every page rule at "error", for a Vite+ or ESLint config to spread.
 * @type {Record<string, "error">}
 */
export const recommended = Object.fromEntries(Object.keys(pageRules).map((name) => [`siyahi/${name}`, "error"]));

export default plugin;
