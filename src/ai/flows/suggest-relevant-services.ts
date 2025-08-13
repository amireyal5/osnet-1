'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting relevant social services based on user input.
 *
 * - suggestRelevantServices - The main function to trigger the flow.
 * - SuggestRelevantServicesInput - The input type for the suggestRelevantServices function.
 * - SuggestRelevantServicesOutput - The output type for the suggestRelevantServices function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRelevantServicesInputSchema = z.object({
  userInput: z
    .string()
    .describe("The user's input describing their needs and circumstances."),
  availableResources: z
    .string()
    .describe('A list of available social services and resources.'),
});
export type SuggestRelevantServicesInput = z.infer<
  typeof SuggestRelevantServicesInputSchema
>;

const SuggestRelevantServicesOutputSchema = z.object({
  suggestedServices: z
    .string()
    .describe('A list of suggested services relevant to the user.'),
  reasoning: z
    .string()
    .describe('The AI agents reasoning for suggested services.'),
});
export type SuggestRelevantServicesOutput = z.infer<
  typeof SuggestRelevantServicesOutputSchema
>;

export async function suggestRelevantServices(
  input: SuggestRelevantServicesInput
): Promise<SuggestRelevantServicesOutput> {
  return suggestRelevantServicesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRelevantServicesPrompt',
  input: {schema: SuggestRelevantServicesInputSchema},
  output: {schema: SuggestRelevantServicesOutputSchema},
  prompt: `You are a social services expert. Based on the user's input and the available resources, suggest the most relevant services.

User Input: {{{userInput}}}

Available Resources: {{{availableResources}}}

Provide a list of suggested services and explain your reasoning for each suggestion.

Format your response as follows:

Suggested Services: [Service 1], [Service 2], ...
Reasoning: [Reasoning for Service 1], [Reasoning for Service 2], ...`,
});

const suggestRelevantServicesFlow = ai.defineFlow(
  {
    name: 'suggestRelevantServicesFlow',
    inputSchema: SuggestRelevantServicesInputSchema,
    outputSchema: SuggestRelevantServicesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
