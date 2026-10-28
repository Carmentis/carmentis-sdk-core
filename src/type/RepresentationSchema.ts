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
	template: v.string(),
});
