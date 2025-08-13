
"use client";

import { MainLayout } from "@/components/main-layout";
import { SurveyBuilder } from "@/components/surveys/SurveyBuilder";

export default function NewSurveyPage() {
  return (
    <MainLayout>
        <SurveyBuilder />
    </MainLayout>
  );
}
