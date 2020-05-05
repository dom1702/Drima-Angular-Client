import { Component, Injector, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import * as moment from 'moment';

export enum QuestionDisplayType {
    SingleChoice,
    PictureChoice,
    BinaryChoice
}

export enum QuestionContentType {
    LicenseClass,
    TrafficSituation,
    RiskIdentify
}

class LicenseClass {
    name: string;
    token: string;
    vehicleDimensions?: VehicleDimensions;   
    includePictureTasks: boolean  
}

export class EvaluatedQuiz {
    incorrectQuestions: TheoryExamQuestion[];
    correctAnswersTotal: number;
    questionsTotal: number;

    showCategoryErrors: boolean = false;
    errorsLicenceClassQuestions?: number;
    errorsSituationQuestions?: number;
    errorsRiskQuestions?: number;

    correctLicenceClassQuestions?: number;
    correctSituationQuestions?: number;
    correctRiskQuestions?: number;

    totalLicenceClassQuestions?: number;
    totalSituationQuestions?: number;
    totalRiskQuestions?: number;

    quizPassed? : boolean;
}

export class VehicleDimensions {
    maxLength : number;
    totalWeight;
    transportWeight : number;
    carWeight : number;
    height : string;

    constructor(length : number, trWeight: number, cWeight : number, height: string) {
        this.maxLength = length;
        this.transportWeight = trWeight;
        this.carWeight = cWeight;
        this.totalWeight = this.transportWeight + this.carWeight;
        this.height = height;
    }
}

export class TheoryExamQuestion {
    quest : string;
    pictureUrl? : string;
    answerOptions : string[];
    correctAnswer : number;
    selectedAnswer? : number = -1;
    answerAttempts?: number = 0;
    hint?: string;
    isMarked?: boolean = false; 

    displayType: QuestionDisplayType; 
    contentType: QuestionContentType;
}

export class QuizSession {
    //user : UserLoginInfoDto;
    quiz : TheoryExamQuestion[];
    selectedQuestion: number;
    duration: number; // in minutes
    startTime: moment.Moment;
    endTime: moment.Moment;
    predefindedQuizId : string;
    isMarkable: boolean;
    vehicleInformations? : VehicleDimensions;

    incorrectQuestions: TheoryExamQuestion[];
    maxErrorsLicenceClassQuestions?: number;
    maxErrorsSituationQuestions?: number;
    maxErrorsRiskQuestions?: number;

    constructor(markable: boolean, timeInMinutes: number, dimensions?: VehicleDimensions) {
        this.isMarkable = markable;
        this.vehicleInformations = dimensions;
        this.selectedQuestion = 1;
        this.duration = timeInMinutes;
        this.incorrectQuestions = [];
    }

    hasAnswer(quizIndex: number) : boolean {
        if(this.quiz.length > 0)
        {
            return this.quiz[quizIndex].selectedAnswer > -1;
        }
        return false;
    }

    numberOfLicenceClassQuestions() : number {
        let n = 0;
        if(this.quiz != null)
        {
            for (let index = 0; index < this.quiz.length; index++) {
                if(this.quiz[index].contentType == 0)
                n++;               
            }
        }
        return n;
    }

    numberOfSituationQuestions() : number {
        let n = 0;
        if(this.quiz != null)
        {
            for (let index = 0; index < this.quiz.length; index++) {
                if(this.quiz[index].contentType == 1)
                n++;               
            }
        }
        return n;
    }

    numberOfRiskIdentifyingQuestions() : number{
        let n = 0;
        if(this.quiz != null)
        {
            for (let index = 0; index < this.quiz.length; index++) {
                if(this.quiz[index].contentType == 2)
                n++;               
            }
        }
        return n;
    }

    getNextQuestion() : TheoryExamQuestion {
        let index = this.selectedQuestion;
        if(index < 0 || index > this.quiz.length)
            return null;
        else
            return this.quiz[index];
    }

    getCurrentQuestion() : TheoryExamQuestion {
        let index = this.selectedQuestion-1;
        if(index < 0 || index > this.quiz.length)
            return null;
        else
            return this.quiz[index];
    }
}

@Component({
    templateUrl: './sv-licenseClassTasksOverview.component.html',
    styleUrls: ['./sv-licenseClassTasksOverview.component.css'],
    animations: [appModuleAnimation()]
})
export class SVLicenseClassTasksOverview extends AppComponentBase implements OnInit {

    currentLicenseClass : LicenseClass;
    trafficSituationTaskNames : string[] = [];

    constructor(
        injector: Injector,
    ) {
        super(injector);
    }

    ngOnInit(): void { 
        let vehicleDimensions = new VehicleDimensions(10, 2, 2.5, "2");
        this.currentLicenseClass = {
            name: 'Passenger car with trailer',
            token: 'BE',
            vehicleDimensions : vehicleDimensions,
            includePictureTasks : true
        }; 
        
        this.trafficSituationTaskNames = ["Iam allowed to turn right", "Iam allowed to turn left", "Iam allowed to turn straight", "the cars are parked correctly"];
        
    }

    startSelectedQuiz(id: string) : void {
        console.log("start exam");
    }

}