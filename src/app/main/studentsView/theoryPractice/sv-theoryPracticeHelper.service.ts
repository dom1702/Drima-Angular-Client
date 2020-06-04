import { Injectable } from "@angular/core";
import { LicenseClass, QuizSession } from "./sv-licenseClassTasksOverview.component";

@Injectable({
    providedIn:"root"
})

export class SVTheoryPracticeHelperService {   
    selectedLicenseClass: LicenseClass;
    selectedQuestionSeries: string;

    quizDuration: number; 
    quizMarkable: boolean;
    quizId: number;

    maxErrorsLicenseClassQuestions: number;
    maxErrorsTrafficSituationQuestions: number;
    maxErrorsRiskIdentifyingQuestions: number;
}