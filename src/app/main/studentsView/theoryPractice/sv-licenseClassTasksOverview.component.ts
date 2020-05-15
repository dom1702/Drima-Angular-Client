import { Component, Injector, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import * as moment from 'moment';
import { threadId } from 'worker_threads';
import { TheoryExamsServiceProxy, GetTopicsForViewDto, GetTheoryExamPreparationForViewDto } from '@shared/service-proxies/service-proxies';
import { Router } from '@angular/router';
import { SVTheoryPracticeHelperService } from './sv-theoryPracticeHelper.service';

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

export class LicenseClass {
    name: string;
    token: string;
    vehicleDimensions?: VehicleDimensions;   
    includePictureTasks: boolean;  
    pictureUrl: string;
    
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
    width: number;
    height : number;

    constructor(length : number, height?: number, trWeight?: number, cWeight? : number, totalWeight?: number, width? : number) {
        this.maxLength = length;
        this.transportWeight = trWeight;
        this.carWeight = cWeight;
        this.width = width;
        this.height = height;
        
        if(totalWeight)
            this.totalWeight = totalWeight;
        else 
            this.totalWeight = this.transportWeight + this.carWeight;
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
    classInformations? : LicenseClass;

    incorrectQuestions: TheoryExamQuestion[];
    maxErrorsLicenceClassQuestions?: number;
    maxErrorsSituationQuestions?: number;
    maxErrorsRiskQuestions?: number;

    constructor() {       
        this.selectedQuestion = 1;
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
    animations: [appModuleAnimation()],
    providers:[TheoryExamsServiceProxy]
})

export class SVLicenseClassTasksOverview extends AppComponentBase implements OnInit {

    currentLicenseClass : LicenseClass;
    trafficSituationQuestionSeries : string[] = [];
    classQuestionSeries : string[] = [];
    trafficSignQuestionSeries : string[] = [];

    classQuestionCount: number;
    trafficSituationQuestionCount: number;
    riskIdentifyingQuestionCount: number;
    errorsClassCount: number;
    errorsTrafficSituationCount: number;
    errorsRiskIdentifyingCount: number;
    duration: number;

    exam = "Theory Exam";
    previewReceived : boolean;
    
    constructor(injector: Injector, 
        private theoryPracticeHelper: SVTheoryPracticeHelperService, 
        private theoryExamService: TheoryExamsServiceProxy,
        private router : Router) {
        super(injector);
    }

    ngOnInit(): void {     
        this.currentLicenseClass = this.theoryPracticeHelper.selectedLicenseClass;
        
        if(this.currentLicenseClass)
        {
            this.getLicenseClassTaskTopics();
            this.getTheoryExamPreview();
        }
        else
        {
            console.log("Warning: No selected license class found, navigate back and select again");
            this.router.navigateByUrl("/app/main/studentsView/theoryPractice");
        }

        this.trafficSituationQuestionSeries = ["Iam allowed to turn right", "Iam allowed to turn left", "Iam allowed to turn straight", "the cars are parked correctly"]; 
        this.classQuestionSeries = ["Class Question Series 1"];     
        this.trafficSignQuestionSeries = ["Traffic Sign Series 1", "Traffic Sign Series 2"];                   
    }

    startSelectedQuiz(id: string, markable: boolean) : void {
        console.log("start exam " + id);
        this.theoryPracticeHelper.quizId = id;
        this.theoryPracticeHelper.quizMarkable = markable;
        this.router.navigateByUrl("/app/main/studentsView/theoryPractice/quiz");
    }

    getLicenseClassTaskTopics() {
        this.theoryExamService.getTopicsForView(this.currentLicenseClass.token).subscribe(
            (result) => this.generateTaskTopics(result)
        );
    }

    getTheoryExamPreview() {
       this.theoryExamService.getTheoryExamPreparationForView(this.currentLicenseClass.token).subscribe(
           (result) => {
               if(result != null)
               {
                    this.previewReceived = true;
                    this.trafficSituationQuestionCount = result.trafficSituationsQuestionCount;
                    this.classQuestionCount = result.classQuestionCount;
                    this.riskIdentifyingQuestionCount = result.riskIdentifyingQuestionCount;
                    this.theoryPracticeHelper.quizDuration = this.duration = result.maxTimeInMinutes;
                    this.theoryPracticeHelper.maxErrorsLicenseClassQuestions = this.errorsClassCount = 
                        result.classQuestionMaxIncorrectCount;
                    this.theoryPracticeHelper.maxErrorsRiskIdentifyingQuestions = this.errorsRiskIdentifyingCount = 
                        result.riskIdentifyingQuestionMaxIncorrectCount;
                    this.theoryPracticeHelper.maxErrorsTrafficSituationQuestions = this.errorsTrafficSituationCount = 
                        result.trafficSituationsQuestionMaxIncorrectCount; 
               }         
           });
    }

    generateTaskTopics(result : GetTopicsForViewDto) {
        for (let index = 0; index < result.topics.length; index++) {       
            console.log(result.topics[index].name);  
            console.log(result.topics[index].licenseClasses);  
            console.log(result.topics[index].id);         
        }
    }

}