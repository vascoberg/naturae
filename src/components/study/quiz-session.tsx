"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QuizQuestion } from "./quiz-question";
import { QuizAudioQuestion } from "./quiz-audio-question";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw, ArrowLeft } from "lucide-react";
import type { QuizCard } from "@/lib/actions/quiz";

interface QuizSessionProps {
  deckId: string;
  deckName: string;
  questions: QuizCard[];
  onExit: () => void;
}

interface QuizResult {
  questionId: string;
  selectedId: string;
  isCorrect: boolean;
}

export function QuizSession({
  deckId,
  deckName,
  questions,
  onExit,
}: QuizSessionProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = questions[currentIndex];
  const correctCount = results.filter((r) => r.isCorrect).length;

  const handleAnswer = useCallback(
    (selectedId: string, isCorrect: boolean) => {
      const newResult: QuizResult = {
        questionId: currentQuestion.cardId,
        selectedId,
        isCorrect,
      };

      setResults((prev) => [...prev, newResult]);
      // Navigatie gebeurt nu via handleNext, niet automatisch
    },
    [currentQuestion?.cardId]
  );

  const handleNext = useCallback(() => {
    // Ga naar volgende vraag of eindig de quiz
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  }, [currentIndex, questions.length]);

  const handleRestart = () => {
    setCurrentIndex(0);
    setResults([]);
    setIsFinished(false);
  };

  const handleBackToDeck = () => {
    router.push(`/decks/${deckId}`);
  };

  // Bereken score percentage
  const scorePercentage = Math.round((correctCount / questions.length) * 100);

  // Bepaal feedback bericht op basis van score
  const getFeedbackMessage = () => {
    if (scorePercentage === 100) {
      return "Perfect! Je kent alle soorten!";
    } else if (scorePercentage >= 80) {
      return "Uitstekend! Je kent de meeste soorten goed.";
    } else if (scorePercentage >= 60) {
      return "Goed gedaan! Blijf oefenen om nog beter te worden.";
    } else if (scorePercentage >= 40) {
      return "Prima begin! Probeer het nog eens om je score te verbeteren.";
    } else {
      return "Blijf oefenen! Je leert elke keer nieuwe soorten kennen.";
    }
  };

  // Einde scherm
  if (isFinished) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            {/* Score display */}
            <div className="space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Quiz voltooid!</h2>
              <p className="text-muted-foreground">{deckName}</p>
            </div>

            {/* Score cirkel */}
            <div className="py-6">
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    className="text-muted stroke-current"
                    strokeWidth="8"
                    fill="none"
                    r="56"
                    cx="64"
                    cy="64"
                  />
                  <circle
                    className="text-primary stroke-current transition-all duration-500"
                    strokeWidth="8"
                    strokeLinecap="round"
                    fill="none"
                    r="56"
                    cx="64"
                    cy="64"
                    strokeDasharray={`${scorePercentage * 3.52} 352`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{correctCount}</span>
                  <span className="text-sm text-muted-foreground">
                    van {questions.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Feedback */}
            <p className="text-muted-foreground">{getFeedbackMessage()}</p>

            {/* Score details */}
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-950">
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {correctCount}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Correct
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-950">
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {questions.length - correctCount}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Fout
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acties */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleBackToDeck}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug naar deck
          </Button>
          <Button className="flex-1" onClick={handleRestart}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Opnieuw proberen
          </Button>
        </div>
      </div>
    );
  }

  // Quiz vraag - kies component op basis van mediaType
  const QuestionComponent = currentQuestion.mediaType === "audio"
    ? QuizAudioQuestion
    : QuizQuestion;

  return (
    <div className="max-w-md mx-auto">
      <QuestionComponent
        question={currentQuestion}
        onAnswer={handleAnswer}
        onNext={handleNext}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        isLastQuestion={currentIndex === questions.length - 1}
      />
    </div>
  );
}
