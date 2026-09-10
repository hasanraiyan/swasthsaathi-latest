"use client";

import * as React from "react";
import {
  Questionnaire,
  QuestionnaireItem,
  QuestionnaireTitle,
  QuestionnaireChoices,
  QuestionnaireChoice,
  QuestionnaireInput,
  QuestionnaireActions,
  QuestionnaireProgress,
  QuestionnairePrevious,
  QuestionnaireSkip,
  QuestionnaireNext,
  QuestionnaireSubmit,
} from "@/components/ui/questionnaire";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { ToolCallCard, humanizeToolName } from "./tool-call-card";
import type { PersonaInterrupt } from "@personaai/react";

/**
 * HITL approval + multi-step clarification — built on the Questionnaire
 * primitive, which already is a multi-step Q&A wizard (progress, keyboard
 * 1-9 shortcuts via shortcuts="numbers", previous/skip/next/submit nav).
 * NotebookChat.js hand-rolled all of this (step state, keyboard handler,
 * custom-text fallback); here it's what the primitive is built for.
 */
function InterruptPanel({
  interrupt,
  onSubmitClarification,
  onDecideHitl,
}: {
  interrupt: PersonaInterrupt;
  onSubmitClarification?: (answers: Record<string, string>) => void;
  /** PersonaResumeValue's hitl `decisions` array has no id field — a
   * decision is matched back to its actionRequest by array index. */
  onDecideHitl?: (actionIndex: number, decision: "approve" | "reject") => void;
}) {
  if (interrupt.kind === "hitl") {
    return (
      <Card size="sm" className="gap-2 rounded-none">
        <CardContent className="flex flex-col gap-2 p-3">
        <div className="text-xs font-semibold text-muted-foreground">
          Waiting for your approval to continue
        </div>
        {interrupt.actionRequests.map((action, index) => {
          const label = humanizeToolName(action.name);
          return (
            <div key={index} className="flex flex-col gap-2">
              {/* Same ToolCallCard every completed call renders through —
                  starts collapsed like any other tool card. The header alone
                  (title + subtitle, e.g. "Creating agent" / "Exam Master")
                  already tells a human enough to decide approve/reject; forcing
                  it open by default made a large upsert_agent payload (a long
                  system prompt, etc.) grow tall enough to push the
                  Approve/Reject buttons off-screen. Still capped + scrollable
                  for whenever it IS expanded. */}
              <ScrollArea className="max-h-[50vh]">
                <ToolCallCard
                  toolCall={{
                    toolCallId: `hitl-${index}`,
                    toolName: action.name,
                    args: JSON.stringify(action.args ?? {}),
                  }}
                  // Explicit `false`, not omitted — ToolCallCard's own default
                  // for an upsert defaults to open while pending (no result/
                  // isError above means the card reads as "running"), which is
                  // exactly the forced-open behavior this panel doesn't want.
                  defaultOpen={false}
                />
                <ScrollBar orientation="vertical" />
              </ScrollArea>
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={`Reject ${label}`}
                  onClick={() => onDecideHitl?.(index, "reject")}
                >
                  <XIcon /> Reject
                </Button>
                <Button
                  type="button"
                  size="sm"
                  aria-label={`Approve ${label}`}
                  onClick={() => onDecideHitl?.(index, "approve")}
                >
                  <CheckIcon /> Approve
                </Button>
              </div>
            </div>
          );
        })}
        </CardContent>
      </Card>
    );
  }

  const { questions } = interrupt;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const answers: Record<string, string> = {};
    questions.forEach((q) => {
      const value = data.get(q.id);
      if (typeof value === "string" && value.trim()) answers[q.id] = value.trim();
    });
    onSubmitClarification?.(answers);
  };

  return (
    <Card size="sm" className="rounded-none">
      <CardContent className="p-3">
      <Questionnaire
        items={questions.map((q) => ({
          name: q.id,
          choices: q.options?.map((o) => ({ value: o })),
          required: q.required,
        }))}
        shortcuts="numbers"
        onSubmit={handleSubmit}
      >
        {questions.map((q) => (
          <QuestionnaireItem key={q.id} name={q.id} required={q.required}>
            <QuestionnaireTitle>{q.text}</QuestionnaireTitle>
            {q.options?.length ? (
              <QuestionnaireChoices>
                {q.options.map((opt) => (
                  <QuestionnaireChoice key={opt} value={opt}>
                    {opt}
                  </QuestionnaireChoice>
                ))}
                {q.allowCustom && (
                  <QuestionnaireInput placeholder="Something else…" />
                )}
              </QuestionnaireChoices>
            ) : (
              <QuestionnaireInput placeholder="Type your answer…" />
            )}
          </QuestionnaireItem>
        ))}
        <QuestionnaireActions>
          <QuestionnaireProgress />
          <QuestionnairePrevious />
          <QuestionnaireSkip />
          <QuestionnaireNext />
          <QuestionnaireSubmit />
        </QuestionnaireActions>
      </Questionnaire>
        </CardContent>
      </Card>
  );
}

export { InterruptPanel };
