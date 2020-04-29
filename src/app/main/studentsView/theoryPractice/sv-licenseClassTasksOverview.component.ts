import { Component, Injector, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import * as moment from 'moment';
import { Message } from 'primeng/api';

class LicenseClass {
    name: string;
    token: string;
    vehicleDimensions?: VehicleDimensions;   
    includePictureTasks: boolean  
}

enum QuestionType {
    SingleChoice,
    PictureChoice,
    BinaryChoice
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
    type: QuestionType;
    isMarked?: boolean = false;     
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

    constructor(markable: boolean, timeInMinutes: number, dimensions?: VehicleDimensions) {
        this.isMarkable = markable;
        this.vehicleInformations = dimensions;
        this.selectedQuestion = 1;
        this.duration = timeInMinutes;
    }

    hasAnswer(quizIndex: number) : boolean {
        if(this.quiz.length > 0)
        {
            return this.quiz[quizIndex].selectedAnswer > -1;
        }
        return false;
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
    trafficSituationsReferences : Message[] = [];

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
        
        this.trafficSituationTaskNames = ["Test 1", "Test 2", "Test 3", "Test 4"];
        this.trafficSituationsReferences.push({
            severity: "info", 
            summary: "Choose a question serie by clicking the links below. Each serie includes 10 questions. ", 
            detail: ""});
    }

    startQuizSession(markable: boolean) : void {
        console.log("start exam");
    }

}