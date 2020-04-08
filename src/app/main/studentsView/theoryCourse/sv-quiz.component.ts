import { Component, ViewChild, Injector, OnInit, ViewEncapsulation, AfterViewInit, Output, OnChanges, Sanitizer, SecurityContext, Pipe, PipeTransform, ViewChildren, QueryList, OnDestroy } from "@angular/core";
import { AppComponentBase } from "@shared/common/app-component-base";
import { appModuleAnimation } from "@shared/animations/routerTransition";
import { TabsetComponent, TabDirective } from "ngx-bootstrap";
import { Observable, Subject } from "rxjs";
import { UserLoginInfoDto, OnlineTheoryServiceProxy, PrepareOnlineTheoryLessonDto, OnlineTheoryOpeningHoursDto, StartNextOnlineTheoryLessonInput, CourseDto, OnlineTheoryLessonDto, OTSingleChoiceDto } from "@shared/service-proxies/service-proxies";
import * as moment from 'moment';
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { Message } from "primeng/api";
import { Router} from "@angular/router";
import { ICanComponentDeactivate } from "./sv-quiz.guard";
import { SVQuestionComponent } from "./sv-question.component";
import { debug } from "util";
import { List } from "lodash";
import { template } from "@angular/core/src/render3";
import { StudentViewHelper } from "../studentViewHelper.component";

class QuizContent {
    id : number;
    title: string;
    mandatoryTime: number;
    videoId? : string;
    questions? : Question[];
    completed: boolean = false;
}

class Question {
    quest : string;
    nr: number;
    pictureUrl? : string;
    answerOptions : string[];
    correctAnswer : number;
    selectedAnswer : number;
    answerAttempts: number;
}

class Quiz {
    quizTitle: string;
    pages: number;
    sheets: QuizContent[];    
}

class QuizSession {
    user : UserLoginInfoDto;
    quiz : Quiz;
    duration: number;
    progress: number;
    startTime: moment.Moment;
    endTime: moment.Moment;
}

@Component({
    templateUrl: './sv-quiz.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()],
    styleUrls: ['./sv-quiz.component.css'],
    selector: 'quiz'
})

export class SVQuizComponent extends AppComponentBase implements OnInit, OnDestroy, ICanComponentDeactivate {
     
    get nextOnlineLesson() : OnlineTheoryLessonDto {
        return this._nextOnlineLesson;
    }
    set nextOnlineLesson(value : OnlineTheoryLessonDto) {
        if(value != null)
        {
            this._nextOnlineLesson = value;
            this.createQuiz();
            this.enableQuizPart(0);
        }
    }

    _nextOnlineLesson: OnlineTheoryLessonDto;
    
    dummyData : Quiz = {
        quizTitle: 'TestQuiz 1',
        pages: 3,
        sheets: [
        {
            id: 0,
            title: 'Test Video 1',
            mandatoryTime: 2,
            videoId: "https://player.vimeo.com/video/692568",
            questions: null,
            completed : false
        },
        {
            id: 1,
            title: 'Test Questions 1',
            mandatoryTime: 2,
            videoId: null,
            questions : [{
                quest: 'Complete the row: ABC',
                nr : 0,
                answerOptions : ['F', 'X', 'D'] ,
                correctAnswer : 2,
                selectedAnswer : null,
                answerAttempts : 0        
            },
            {              
                quest: 'Add 2 to 16',
                nr : 1,
                answerOptions : ['14', '18', '216'],
                correctAnswer : 1,
                selectedAnswer : null,
                answerAttempts : 0 
            },
            {               
                quest: 'the glas is.. ',
                nr : 2,
                pictureUrl : "http://www.dadsonline.com.au/wp-content/uploads/glass-half-full.jpeg",
                answerOptions : ['Half-full', 'Half-empty', 'either or!'],
                correctAnswer : 2  ,
                selectedAnswer : null,
                answerAttempts : 0       
            }
            ], 
            completed: false 
              
        },
        {
            id: 2,
            title: 'Test Video 2',
            mandatoryTime: 2,
            videoId: "https://player.vimeo.com/video/692568",
            questions: null,
            completed: false
        },
        {
            id: 3,
            title: 'Test Video NEXT',
            mandatoryTime: 2,
            videoId: "https://player.vimeo.com/video/692568",
            questions: null,
            completed: false
        },
        {
            id: 4,
            title: 'Test Vid ULTRA',
            mandatoryTime: 2,
            videoId: "https://player.vimeo.com/video/692568",
            questions: null,
            completed: false
        }
        ]
    };

    dummyOpeningHours : number[] = [
        9,
        10,
        11, 
        12,
        13,
        14,
        15,
        16,
        17,
        18
    ]
    
    dummyOpeningDays : number[] = [
       1,2,3,4,5
    ]
                      
    @ViewChild('quizTabs')
    quizTabs : TabsetComponent;

    @ViewChildren('questions')
    questions : QueryList<SVQuestionComponent>;
   
    navigateAwaySelection: Subject<boolean> = new Subject<boolean>();

    homeTab : TabDirective;
    //startTab : TabDirective;

    tabsData : any[] = []; // read data from dummyData into a struct that can be red by the template
    messages: Message[] = [];

    currentSession : QuizSession = null;
    currentTimer : number = Number.MAX_VALUE;
    closingTime : moment.Moment;
    openingTime: moment.Moment;
    quizAborted : boolean;
    quizFinished : boolean = false;
    
    get isClosed(): boolean {
        let x = moment().isBetween(this.openingTime, this.closingTime);
        return !x;      
    }

    get sheetNumber() : number {
        if(this.currentSession != null)
            return this.currentSession.quiz.sheets.length;
        else
            return 0;
    }

    constructor(injector: Injector,          
        private router : Router, 
        private _onlineTheoryService : OnlineTheoryServiceProxy,
        private _helper : StudentViewHelper) 
    {
        super(injector);
    }

    ngOnInit(): void {     
        this.quizAborted = true; 
        this.quizFinished = false;   
        /*this.createQuiz(); 
        this.closingTime = moment().locale(moment.defaultFormat);
        this.openingTime = moment().locale(moment.defaultFormat);
        this.closingTime.set("hour", 13);
        this.closingTime.set("second", 0);
        this.closingTime.set("minute", 0);
        this.openingTime.set("hour", 8);
        this.openingTime.set("second", 0);
        this.openingTime.set("minute", 0);
        //console.debug("current time: " + moment().format() + 
        //    "| closing: " + this.closingTime.format()  + 
        //    "| opening: " + this.openingTime.format() );
        */  
       
    }

    // ngAfterViewInit(): void {
    //     this.homeTab = this.quizTabs.tabs[0]; 
    //     // this.startTab = this.quizTabs.tabs[0];  
    //     this.quizTabs.tabs.splice(0,1);
    //     this.quizTabs.tabs.push(this.homeTab);               
    // }

    ngOnDestroy() : void {
        console.log("call on destroy");
        this.closeQuiz();
    }

    onSelect(data : TabDirective) : void {        
        var tabNumber = parseInt(data.id);
        if(tabNumber != NaN)
        {
            if(tabNumber < this.currentSession.progress)
            {                                                             
                this.previousTabSelected(tabNumber);          
            }
        }       
    }

    onAbortedChanged(value : any) {
        console.debug("aborted changed ");
        this.quizAborted = value[0];   
        if(this.quizAborted == false) 
        {
            var input : StartNextOnlineTheoryLessonInput= new StartNextOnlineTheoryLessonInput();
            input.courseId = this._helper.selectedCourse.course.id;
            input.studentPhoneNumber = value[1];
            console.debug("CourseID: " + input.courseId + "phn: " + input.studentPhoneNumber);
            this.startNextOnlineTheoryLesson(input);      
            //this.enableQuizPart(0);
        }
    }

    onContinueLesson() {
       console.log("continue with next quiz");
       this.closeQuiz();      
    }

    startTabSelected() {
        if(!this.quizAborted)
        {
            this.message.confirm('Confirm', "eLesson has to be started again if you cancel it, are you sure?",
            (isConfirmed) => {
                if (isConfirmed) {            
                    this.enableQuizPart(this.currentSession.progress);  
                }                 
            });
        }   
    }

    previousTabSelected(tabNumber: number) {
        if(this.quizFinished) {
            this.enableQuizPart(tabNumber);  
        }
        else {
        this.message.confirm('Do you really want to skip back?', "Solved questions wont be saved.",
            (isConfirmed) => {
                if (isConfirmed) {                                    
                    this.enableQuizPart(tabNumber);  
                } 
                else {                    
                    this.quizTabs.tabs[this.currentSession.progress+1].active = true; 
                }                  
            });
        }
    }

    cancelTabSelected() {
        if(!this.quizAborted || this.isClosed)
        {
            this.message.confirm('Do you really want to end?', "Progress will be lost.",
            (isConfirmed) => {
                if (isConfirmed) {           
                    this.closeQuiz(); 
                }                 
            });
        }
        else { //homeTab selected
            this.router.navigateByUrl("/app/main/studentsView/theoryLessons");
        }             
    }

    onValueSelected(questionParam : any) : void{       
        this.currentSession.quiz.sheets[this.currentSession.progress].
            questions[questionParam.qNr].selectedAnswer = questionParam.answer;
        this.currentSession.quiz.sheets[this.currentSession.progress].
            questions[questionParam.qNr].answerAttempts = questionParam.att; 
    }

    canDeactivate(): Observable<boolean> | boolean {            
        if(this.isClosed || this.quizAborted || this.quizFinished)
        {
            return true;
        }
        else {
            this.message.confirm('Discard answers from this sheet?',
                (isConfirmed) => {
                    if (isConfirmed) {
                        this.navigateAwaySelection.next(isConfirmed);
                        this.closeQuiz(); 
                    }
                    else {
                        this.homeTab.active = false;
                        this.quizTabs.tabs[this.currentSession.progress+1].active = true;                    
                    }
                });
            return this.navigateAwaySelection;
        }
    }

    startNextOnlineTheoryLesson(input: StartNextOnlineTheoryLessonInput)
    {    
        this._onlineTheoryService.startNextOnlineTheoryLesson(input).subscribe((result) => {
            //this.finishId = "";
            console.log(result);
            this.nextOnlineLesson = result;
        });
    }
    
    closeQuiz() : void {
        if(this.currentSession != null)  
        {
            this.saveQuiz();

            for (let index = 0; index < this.currentSession.quiz.sheets.length; index++) {
                this.deleteQuizData(index);           
            }
            this.currentSession.progress = 0; 
            
            for (let index = 1; index < this.tabsData.length; index++) {                      
                this.tabsData[index].disabled = true;
                this.changeTabState(index, "closedTab", false);                            
            }
                        
            this.tabsData[0].active = true;
            this.changeTabState(0, "selected", false);           
        }

        this.messages = [];
        this.quizAborted = true;
        this.quizFinished = false;
    }

    updateQuiz() : void {
        if(this.currentSession.quiz.sheets[this.currentSession.progress].questions != null && 
            !this.sheetCompleted(this.currentSession.quiz.sheets[this.currentSession.progress]))
        {
            //console.log("sheet not completed yet " + this.currentTimer.toString());
            this.showMessage("Sheet not completed yet.", 'You need to answer all questions!');
        }
        else if(this.currentTimer > 0)
        {
           // console.log("timer is not 0 yet " + this.currentTimer.toString());
            this.showMessage("Minimum time not reached yet!", 'You need to wait for another ' + 
                this.getTimeInMinutes(this.currentTimer) + "!");
        }
        else {
           // console.log("enable next sheet " + this.currentTimer.toString());
            this.enableQuizPart(this.currentSession.progress+1);
        }    
    }

    sheetCompleted(sheet: QuizContent) : boolean {
        if(sheet.questions != null)
        {
            for (let index = 0; index < sheet.questions.length; index++) {
                if(sheet.questions[index].selectedAnswer != sheet.questions[index].correctAnswer)
                    return false;
            }
            return true;
        }
        return false;      
    }

    saveQuiz() {
        this.currentSession.endTime = moment().locale(moment.defaultFormat);
        let x = moment.duration(this.currentSession.endTime.diff(this.currentSession.startTime)); 
        this.currentSession.duration = x.get("seconds");
        //send information to server...
        this.debugSavedQuizData();
    }

    enableQuizPart(numberOfTab : number) {       
        //console.log("quiz newProgress " + numberOfTab + " | currProgress: " + this.currentSession.progress + "   tD.length: " + this.tabsData.length) ;
        let progress = numberOfTab;

        if(progress > this.currentSession.progress)
        {
            if(progress > 0)
            {
                this.changeTabState(this.currentSession.progress, "finishedTab", true);
                this.currentSession.quiz.sheets[this.currentSession.progress].completed = true;
                this.tabsData[this.currentSession.progress].active = false;              
            }  

            if(progress > this.tabsData.length-1) // end reached
            {                                           
                this.tabsData[this.currentSession.progress].active = true; 
                this.quizFinished = true;
                return;
            }                                              
        }
        else if(progress < this.currentSession.progress){
            for (let index = this.currentSession.progress; index >= progress; index--) {
                this.deleteQuizData(index);                
                this.currentSession.quiz.sheets[index].completed = false;
                this.tabsData[index].disabled = true;
                this.changeTabState(index, "closedTab", false);  
                this.questions.forEach(element => {
                    element.reset();
                });               
            }            
        }
        
        this.tabsData[progress].disabled = false;
        this.tabsData[progress].active = true;   
        this.changeTabState(progress, "selectedTab", false)  
        this.startTimer(this.currentSession.quiz.sheets[progress].mandatoryTime);               
        this.currentSession.progress = progress;      
        this.messages = [];             
    }

    addTabData(tabHeading: string, isDisabled : boolean, isActive, identifier: string, 
        contentTitle : string, mandTime: number,  tabContent : any[], videoUrl?: string): void {
      
        this.tabsData.push({
            heading : tabHeading, 
            disabled : isDisabled,
            active : isActive,
            id: identifier,
            title: contentTitle,
            mandatoryTime: mandTime,
            content : tabContent,
            video: videoUrl,
            stylingClass: "closedTab",
            finished: false
        });           
    }

    changeTabState(targetTab: number, styling: string, isFinished: boolean) {
        if(targetTab >= 0 && targetTab < this.tabsData.length)
        {
            this.tabsData[targetTab].stylingClass = styling;
            this.tabsData[targetTab].finished = isFinished;
        }      
    }

    getTimeInMinutes(seconds : number) : string {
        let n : number = (seconds/60);
        n = Math.round(n);
        if(n == 0)
            n = 1;

        return n.toFixed(0).toString() + (n > 1 ? " minutes" : " minute");
    }

    startTimer(timerValue : number) {        
        this.currentTimer = timerValue;
        let intervalId = setInterval(() => {
            this.currentTimer = this.currentTimer - 1;
            if(this.currentTimer === 0) clearInterval(intervalId)           
        }, 1000)
        //console.log("start timer... " + intervalId);
    }

    showMessage(_summary: string, _details?: string) {
        this.messages = [];
        this.messages.push({severity: 'error', summary: _summary, detail: _details })
    }
 
    createQuiz() : void {
        let quiz : QuizSession =  {
            user: this.appSession.user,
            quiz : null,
            duration : 0,
            startTime: moment().locale(moment.defaultFormat),
            endTime: null,
            progress: 0
        };

        let temp : QuizContent[] = new QuizContent[this.nextOnlineLesson.sections.length];
        for(let index = 0; index < temp.length; index++)
        {
            temp[index].completed = false;
            temp[index].id = index + 1;
            temp[index].mandatoryTime = this.nextOnlineLesson.sections[index].content[0].mandatoryTimeInMinutes;
            temp[index].title = this.nextOnlineLesson.sections[index].name;

            let isVideoContent = this.nextOnlineLesson.sections[index].content.length == 1 && this.nextOnlineLesson.sections[index].content[0].videoOnly != null 
            if(isVideoContent) // create video content
            {               
                temp[index].videoId = this.nextOnlineLesson.sections[index].content[0].videoOnly.videoUrl;              
            }
            else { //create questions content
                temp[index].questions = new Question[this.nextOnlineLesson.sections[index].content.length];
                for (let j = 0; j < temp[index].questions.length; j++) {
                    temp[index].questions[j] = this.convertToQuestion(this.nextOnlineLesson.sections[index].content[j].singleChoice); 
                }
            }
        }

        let q : Quiz = {
            quizTitle : this.nextOnlineLesson.predefinedTheoryLessonIdString, 
            pages : this.nextOnlineLesson.sections.length,
            sheets : temp
        };

        this.currentSession.quiz = q;

        for (let index = 0; index < this.nextOnlineLesson.sections.length; index++) {
            this.addTabData(" " + (index + 1) + " ", 
                index == 0 ? false : true,
                index == 0 ? true : false,
                this.currentSession.quiz.sheets[index].id.toString(),
                this.currentSession.quiz.sheets[index].title, 
                this.currentSession.quiz.sheets[index].mandatoryTime,
                this.currentSession.quiz.sheets[index].questions,
                this.currentSession.quiz.sheets[index].videoId
            );         
        }     
    }

    convertToQuestion(question : OTSingleChoiceDto) : Question {
        let temp : Question;
        temp.answerAttempts = 0;
        temp.correctAnswer = question.correctAnswer;
        temp.pictureUrl = null; //question.
        temp.quest = question.question;
        let answersLength = this.getNumberOfAnswers(question);
        temp.answerOptions.length = new String[answersLength];
        for (let index = 0; index < answersLength; index++) {
            if(index == 0)
                temp.answerOptions[index] = question.answer1;
            if(index == 1)
                temp.answerOptions[index] = question.answer2;
            if(index == 2)
                temp.answerOptions[index] = question.answer3;
            if(index == 3)
                temp.answerOptions[index] = question.answer4;          
        }
        return temp;
    }

    getNumberOfAnswers(question : OTSingleChoiceDto) {
        if(question.answer2 == null)
            return 1;
        else if(question.answer3 == null)
            return 2;
        else if(question.answer4 == null)
            return 3;
        else return 4;
    }

    deleteQuizData(tabNumber: number) {
        if(this.currentSession.quiz.sheets[tabNumber].questions != null && 
            this.currentSession.quiz.sheets[tabNumber].questions.length > 0)
        {
            for (let index = 0; index < this.currentSession.quiz.sheets[tabNumber].questions.length; index++) {
                if(this.currentSession.quiz.sheets[tabNumber].questions[index].answerAttempts != null)
                    this.currentSession.quiz.sheets[tabNumber].questions[index].answerAttempts = 0;
                if(this.currentSession.quiz.sheets[tabNumber].questions[index].selectedAnswer != null)
                    this.currentSession.quiz.sheets[tabNumber].questions[index].selectedAnswer = -1;
            }
        }
    }

    debugSavedQuizData() {
        console.log("Debug saved work: " + this.currentSession.quiz.quizTitle);
        console.log("duration: " + this.currentSession.duration);
        console.log("start time: " + this.currentSession.startTime.format("HH.mm.ss") + "   endTime: " + this.currentSession.endTime.format("HH.mm.ss") );
        console.log("sheets: ");
        for (let index = 0; index < this.currentSession.quiz.sheets.length; index++) {
            console.log(" sheet nr: " + index +"  completed: " + this.currentSession.quiz.sheets[index].completed);

            if(this.currentSession.quiz.sheets[index].questions != null)
            {
                console.log("questions");
                for (let j = 0; j < this.currentSession.quiz.sheets[index].questions.length; j++) {
                    console.log("question: " + this.currentSession.quiz.sheets[index].questions[j].quest);
                    console.log("answer: " + this.currentSession.quiz.sheets[index].questions[j].selectedAnswer);
                    console.log("attempts: " + this.currentSession.quiz.sheets[index].questions[j].answerAttempts);
                }              
            }
            else {
                console.log("video");
                console.log("name: " + this.currentSession.quiz.sheets[index].title);
            }
        }
    }

}