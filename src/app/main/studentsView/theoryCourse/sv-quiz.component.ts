import { Component, ViewChild, Injector, OnInit, ViewEncapsulation, AfterViewInit, Output, OnChanges, Sanitizer, SecurityContext, Pipe, PipeTransform, ViewChildren, QueryList } from "@angular/core";
import { AppComponentBase } from "@shared/common/app-component-base";
import { appModuleAnimation } from "@shared/animations/routerTransition";
import { TabsetComponent, TabDirective } from "ngx-bootstrap";
import { Observable, Subject } from "rxjs";
import { UserLoginInfoDto } from "@shared/service-proxies/service-proxies";
import * as moment from 'moment';
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { Message } from "primeng/api";
import { Router} from "@angular/router";
import { ICanComponentDeactivate } from "./sv-quiz.guard";
import { SVQuestionComponent } from "./sv-question.component";
import { debug } from "util";

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
    selectedAnswer : string;
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

export class SVQuizComponent extends AppComponentBase implements OnInit, AfterViewInit, ICanComponentDeactivate {
               
    dummyData : Quiz = {
        quizTitle: 'TestQuiz 1',
        pages: 3,
        sheets: [
        {
            id: 0,
            title: 'Test Video 1',
            mandatoryTime: 2,
            videoId: "https://vimeo.com/video/8537555",
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
            videoId: "https://vimeo.com/video/8537555",
            questions: null,
            completed: false
        },
        {
            id: 3,
            title: 'Test Video NEXT',
            mandatoryTime: 2,
            videoId: "https://vimeo.com/video/8537555",
            questions: null,
            completed: false
        },
        {
            id: 4,
            title: 'Test Vid ULTRA',
            mandatoryTime: 2,
            videoId: "https://vimeo.com/video/8537555",
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
    startTab : TabDirective;

    tabsData : any[] = []; // read data from dummyData into a sturct that can be red by the template
    messages: Message[] = [];

    currentSession : QuizSession = null;
    currentTimer : number = Number.MAX_VALUE;
    closingTime : moment.Moment;
    openingTime: moment.Moment;
    quizAborted : boolean;

    get isClosed(): boolean {
        let x = moment().isBetween(this.openingTime, this.closingTime);
        return !x;      
    }

    constructor(injector: Injector, private sanitizer : DomSanitizer, private router : Router) 
    {
        super(injector);
    }

    ngOnInit(): void {          
        this.createQuiz(); 
        this.closingTime = moment().locale(moment.defaultFormat);
        this.openingTime = moment().locale(moment.defaultFormat);
        this.closingTime.set("hour", 21);
        this.closingTime.set("second", 0);
        this.closingTime.set("minute", 0);
        this.openingTime.set("hour", 8);
        this.openingTime.set("second", 0);
        this.openingTime.set("minute", 0);
        console.debug("current time: " + moment().format() + 
            "| closing: " + this.closingTime.format()  + 
            "| opening: " + this.openingTime.format() );
       
        this.quizAborted = true; 
    }

    ngAfterViewInit(): void {   
        this.homeTab = this.quizTabs.tabs[1];
        this.startTab = this.quizTabs.tabs[0];
        this.quizTabs.tabs.splice(1,1);
        this.quizTabs.tabs.push(this.homeTab);         
    }

    onSelect(data : TabDirective) : void {        
        var tabNumber = parseInt(data.id);
        if(tabNumber != NaN)
        {
            if(tabNumber < this.currentSession.progress)
            {                  
                //let shiftBack = tabNumber - this.currentSession.progress;                            
                this.previousTabSelected(tabNumber);       
                //console.log("selected previous tab! switch back! " + tabNumber );     
            }
        }       
    }

    onAbortedChanged(value : boolean) {
        this.quizAborted = value;
        this.enableQuizPart(0);
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
            this.router.navigateByUrl("/app/main/studentsView/theoryCourse/quiz");
        }             
    }

    onValueSelected(questionParam : any) : void{       
        this.currentSession.quiz.sheets[this.currentSession.progress].
            questions[questionParam.qNr].selectedAnswer = questionParam.answer;
        this.currentSession.quiz.sheets[this.currentSession.progress].
            questions[questionParam.qNr].answerAttempts = questionParam.att; 
    }

    canDeactivate(): Observable<boolean> | boolean {            
        if(this.isClosed || this.quizAborted)
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
    
    closeQuiz() : void {   
        this.currentSession.endTime = moment().locale(moment.defaultFormat);
        let x = moment.duration(this.currentSession.endTime.diff(this.currentSession.startTime)); 
        this.currentSession.duration = x.get("seconds");
        //send information to server...
        this.messages = [];
        this.quizAborted = true;
        
        //this.debugSavedQuizData();
        
        for (let index = 0; index < this.currentSession.quiz.sheets.length; index++) {
            this.deleteQuizData(index);           
        }
        this.currentSession.progress = 0; 
        
        for (let index = 1; index < this.tabsData.length; index++) {                      
            this.tabsData[index].disabled = true;
            this.updateTabStyle(index, "closedTab", false);                            
        }
                    
        this.tabsData[0].active = true;
        this.updateTabStyle(0, "selected", false);
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
                if(sheet.questions[index].selectedAnswer == null)
                    return false;
            }
            return true;
        }
        return false;      
    }

    enableQuizPart(numberOfTab : number) {       
        //console.log("quiz newProgress " + numberOfTab + " | currProgress: " + this.currentSession.progress);
        let progress = numberOfTab;

        if(progress > this.currentSession.progress)
        {
            if(progress > 0)
            {
                this.updateTabStyle(this.currentSession.progress, "finishedTab", true);
                this.currentSession.quiz.sheets[this.currentSession.progress].completed = true;
                this.tabsData[this.currentSession.progress].active = false;              
            }  

            if(progress > this.tabsData.length-1) // end reached
            {                                
                this.closeQuiz();
                return;
            }                                              
        }
        else if(progress < this.currentSession.progress){
            for (let index = this.currentSession.progress; index >= progress; index--) {
                this.deleteQuizData(index);                
                this.currentSession.quiz.sheets[index].completed = false;
                this.tabsData[index].disabled = true;
                this.updateTabStyle(index, "closedTab", false);  
                this.questions.forEach(element => {
                    element.reset();
                });               
            }            
        }
        
        this.tabsData[progress].disabled = false;
        this.tabsData[progress].active = true;   
        this.updateTabStyle(progress, "selectedTab", false)  
        this.startTimer(this.currentSession.quiz.sheets[progress].mandatoryTime);               
        this.currentSession.progress = progress;      
        this.messages = [];      
        //console.debug("nr of questions: " + this.questions.length);       
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

    updateTabStyle(targetTab: number, styling: string, isFinished: boolean) {
        if(targetTab >= 0 && targetTab < this.tabsData.length-1)
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
    }

    showMessage(_summary: string, _details?: string) {
        this.messages = [];
        this.messages.push({severity: 'error', summary: _summary, detail: _details })
    }
 
    createQuiz() : void {
        let quiz : QuizSession =  {
            user: this.appSession.user,
            quiz : this.dummyData,
            duration : 0,
            startTime: moment().locale(moment.defaultFormat),
            endTime: null,
            progress: 0
        };

        this.currentSession = quiz;

        for (let index = 0; index < this.currentSession.quiz.sheets.length; index++) {
            this.addTabData(" Part " + (index + 1) + " ", 
                true,
                false,
                this.currentSession.quiz.sheets[index].id.toString(),
                this.currentSession.quiz.sheets[index].title, 
                this.currentSession.quiz.sheets[index].mandatoryTime,
                this.currentSession.quiz.sheets[index].questions,
                this.currentSession.quiz.sheets[index].videoId
            );         
        }     
    }

    deleteQuizData(tabNumber: number) {
        if(this.currentSession.quiz.sheets[tabNumber].questions != null && 
            this.currentSession.quiz.sheets[tabNumber].questions.length > 0)
        {
            for (let index = 0; index < this.currentSession.quiz.sheets[tabNumber].questions.length; index++) {
                if(this.currentSession.quiz.sheets[tabNumber].questions[index].answerAttempts != null)
                    this.currentSession.quiz.sheets[tabNumber].questions[index].answerAttempts = 0;
                if(this.currentSession.quiz.sheets[tabNumber].questions[index].selectedAnswer != null)
                    this.currentSession.quiz.sheets[tabNumber].questions[index].selectedAnswer = "";
            }
        }
    }

    debugSavedQuizData() {
        console.log("Debug saved work: " + this.currentSession.quiz.quizTitle);
        console.log("duration: " + this.currentSession.duration);
        console.log("start time: " + this.currentSession.startTime.format("HH.mm.ss") + "   endTime: " + this.currentSession.endTime.format("HH.mm.ss") );
        console.log("sheets: ");
        for (let index = 0; index < this.currentSession.quiz.sheets.length; index++) {
            console.log("completed: " + this.currentSession.quiz.sheets[index].completed);

            if(this.currentSession.quiz.sheets[index].questions != null)
            {
                console.log("sheet nr: " + index + "questions");
                for (let j = 0; j < this.currentSession.quiz.sheets[index].questions.length; j++) {
                    console.log("question: " + this.currentSession.quiz.sheets[index].questions[j].quest);
                    console.log("answer: " + this.currentSession.quiz.sheets[index].questions[j].selectedAnswer);
                    console.log("attempts: " + this.currentSession.quiz.sheets[index].questions[j].answerAttempts);
                }              
            }
            else {
                console.log("sheet nr: " + index + "video");
                console.log("name: " + this.currentSession.quiz.sheets[index].title);
            }
        }
    }

}