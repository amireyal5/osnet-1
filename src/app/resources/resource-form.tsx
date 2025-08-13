'use client';

import { useState } from 'react';
import {
  suggestRelevantServices,
  type SuggestRelevantServicesOutput,
} from '@/ai/flows/suggest-relevant-services';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, Loader2, ServerCrash, Sparkles } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const availableResources = `
- Food Stamps (SNAP): Provides food-purchasing assistance for low-income people.
- Housing Vouchers (Section 8): Federal government's major program for assisting very low-income families, the elderly, and the disabled to afford decent, safe, and sanitary housing.
- Medicaid: Health care program that assists low-income families or individuals in paying for long-term medical and custodial care costs.
- Temporary Assistance for Needy Families (TANF): Provides temporary financial assistance for pregnant women and families with one or more dependent children.
- Unemployment Insurance: Provides unemployment benefits to eligible workers who are unemployed through no fault of their own.
- Mental Health Counseling: Access to licensed therapists and counselors for mental health support.
- Job Training Programs: Skills training and job placement services for unemployed or underemployed individuals.
`;

export default function ResourceForm() {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SuggestRelevantServicesOutput | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) {
      setError('Please describe the client\'s situation.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await suggestRelevantServices({
        userInput,
        availableResources,
      });
      setResult(res);
    } catch (e) {
      console.error(e);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Resource Finder</CardTitle>
          <CardDescription>
            Describe a client&apos;s situation and needs below. Our AI assistant
            will suggest relevant services from the available resources.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="e.g., 'A single mother of two young children recently lost her job and is facing eviction. She is also experiencing significant stress and anxiety...'"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows={6}
              disabled={isLoading}
            />
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto bg-accent hover:bg-accent/90">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Suggest Resources
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="text-primary" />
              Suggested Services
            </CardTitle>
            <CardDescription>
              Based on your input, here are the recommended services.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold text-lg">Services:</h3>
                <p className="text-muted-foreground">{result.suggestedServices}</p>
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>View AI Reasoning</AccordionTrigger>
                <AccordionContent className="prose prose-sm max-w-none text-muted-foreground">
                    {result.reasoning}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {isLoading && (
         <div className="flex flex-col items-center justify-center gap-4 p-8 text-center rounded-lg border border-dashed">
            <Loader2 className="w-10 h-10 animate-spin text-primary"/>
            <h3 className="text-xl font-semibold">Finding Resources...</h3>
            <p className="text-muted-foreground">Our AI is analyzing the situation to find the best matches.</p>
        </div>
      )}
    </div>
  );
}
