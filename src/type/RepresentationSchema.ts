import * as v from "valibot";

export enum RepresentationTemplateEngine {
	LIQUID = "Liquid",
}

export enum RepresentationFormat {
	MARKDOWN = "markdown",
}

export const RepresentationSchema = v.object({
	templateEngine: v.enum(RepresentationTemplateEngine),
	format: v.enum(RepresentationFormat),
	relativePath: v.optional(v.array(v.union([v.string(), v.number()]))),
	template: v.string(),
});

export type Representation = v.InferOutput<typeof RepresentationSchema>
