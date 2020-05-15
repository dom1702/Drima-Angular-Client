import { Component, Injector, OnInit, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { ICanComponentDeactivate } from '../theoryCourse/sv-quiz.guard';
import { Observable, Subject } from 'rxjs';
import * as moment from 'moment';
import { TheoryExamQuestion, QuizSession, EvaluatedQuiz } from './sv-licenseClassTasksOverview.component';
import { MessageService, SelectItem } from 'primeng/api';
import { SVTheoryPracticeHelperService } from './sv-theoryPracticeHelper.service';
import { TheoryExamsServiceProxy, QuestionDto } from '@shared/service-proxies/service-proxies';
import { Router } from '@angular/router';

@Component({
    templateUrl: './sv-theoryPracticeQuiz.component.html',
    animations: [appModuleAnimation()],
    styleUrls:['./sv-theoryPracticeQuiz.component.css'],
    providers: [MessageService, TheoryExamsServiceProxy]
})

export class SVTheoryPracticeQuizComponent extends AppComponentBase implements OnInit, ICanComponentDeactivate {   
    @ViewChild("pic01") picButton01 : ElementRef;
    @ViewChild("pic02") picButton02 : ElementRef;
    @ViewChild("pic03") picButton03 : ElementRef;

    currentResults : EvaluatedQuiz = null;
    
    dummyContent: TheoryExamQuestion[] = [     
        {
            quest : 'Why?',
            answerOptions: ['therefore!', 'dunno?', 'yolo!'],
            correctAnswer: 2,
            displayType: 0,
            contentType: 0
        },
        {
            quest : 'Select the tree.',
            answerOptions: [
                'https://thorpetrees.com/wp-content/uploads/2013/11/oak-tree11.jpg',
                 'https://i.ytimg.com/vi/KBXqxgGnghY/hqdefault.jpg',
                  'https://img.etsystatic.com/il/32caaf/1331103981/il_340x270.1331103981_rsm5.jpg?version=1'
                ],
            correctAnswer: 0,
            displayType: 1,
            contentType: 0
        },       
        {
            quest : 'Why?',
            answerOptions: ['therefore!', 'dunno?', 'yolo!'],
            correctAnswer: 2,
            displayType: 0,
            contentType: 0
        },
        {
            quest : 'ABC 123?',
            answerOptions: ['A!', 'B?', 'CCC!'],
            correctAnswer: 1,
            displayType: 0,
            contentType: 0
        },
        {
            quest : 'Select the tree.',
            answerOptions: [
                'https://thorpetrees.com/wp-content/uploads/2013/11/oak-tree11.jpg',
                 'https://i.ytimg.com/vi/KBXqxgGnghY/hqdefault.jpg',
                  'https://img.etsystatic.com/il/32caaf/1331103981/il_340x270.1331103981_rsm5.jpg?version=1'
                ],
            correctAnswer: 0,
            displayType: 1,
            contentType: 0
        },
        {
            quest : 'What are the RISKS of alcohol',
            pictureUrl: 'https://m1.paperblog.com/i/64/643369/dibujos-animados-enfermedades-o-trastornos-L-F0UDdF.jpeg',
            answerOptions: ['addiction', 'nothing', 'getting dumb'],
            correctAnswer: 0,
            displayType: 0,
            contentType: 2
        }, 
        {
            quest : 'I can turn straight using this lane',
            pictureUrl: 'https://s3.123fahrschule.de/fahrschule/prod/tuv/question-img/1.4.41-157.jpeg',
            answerOptions: ['yes', 'no'],
            correctAnswer: 1,
            displayType: 2,
            contentType: 1,
            hint: "There is a bus dude!"
        },
        {
            quest : 'I can turn RIGHT using this lane',
            pictureUrl: 'https://s3.123fahrschule.de/fahrschule/prod/tuv/question-img/1.4.41-157.jpeg',
            answerOptions: ['yes', 'no'],
            correctAnswer: 0,
            displayType: 2,
            contentType: 1
        },
        {
            quest : 'I can turn STRAIGHT using this lane',
            pictureUrl: 'https://s3.123fahrschule.de/fahrschule/prod/tuv/question-img/1.4.41-157.jpeg',
            answerOptions: ['yes', 'no'],
            correctAnswer: 1,
            displayType: 2,
            contentType: 1,
            hint: "There is a bus dude!"
        },
        {
            quest : 'I can turn LEFT using this lane',
            pictureUrl: 'https://s3.123fahrschule.de/fahrschule/prod/tuv/question-img/1.4.41-157.jpeg',
            answerOptions: ['yes', 'no'],
            correctAnswer: 0,
            displayType: 2,
            contentType: 1
        },
        {
            quest : 'I can park right now',
            pictureUrl: 'https://s3.123fahrschule.de/fahrschule/prod/tuv/question-img/1.4.41-157.jpeg',
            answerOptions: ['yes', 'no'],
            correctAnswer: 1,
            hint: "dude, you are on a junction...",
            displayType: 2,
            contentType: 1
        }     
    ];

    questionPageButtons: any[] = [];
    
    navigateAwaySelection: Subject<boolean> = new Subject<boolean>();

    quizFinished: boolean = false;
    progressBarType: string = "success";

    timerMinutes: number;
    timerSeconds: number;
    timerProgress: number;
    timerMax: number;
       
    selectOptions: SelectItem[] = [
        {label: 'YES', value: {binary: 0, url:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Yes_Check_Circle.svg/1024px-Yes_Check_Circle.svg.png'}},
        {label: 'NO', value: {binary: 1, url:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/No_icon_red.svg/582px-No_icon_red.svg.png'}},
    ];
    selectedOption: number = -1;

    currentQuizSession: QuizSession;
    markedQuestionPages : number[] = [];
    selectMarkedQuestions: boolean;

    _showDirectionalLinks: boolean = false;
    get showDirectionalLinks() {
        return this._showDirectionalLinks;
    }
    set showDirectionalLinks(value: boolean) {
        this._showDirectionalLinks = value;
    }

    get questionContentIndex() : number {
        let x = this.currentQuizSession.selectedQuestion-1;
        if(x < 0)
        {
            console.log("Warning: TheoryPracticeQuiz question index is below 0!")
            return 0;
        }
        else if(x >= this.dummyContent.length)
        {
            console.log("Warning: TheoryPracticeQuiz question index is higher then content! " + this.dummyContent.length)
            return this.dummyContent.length-1;
        }
        return x;
    }

    get parsedAnswer() : string {
        if(this.currentQuizSession.quiz[this.questionContentIndex].selectedAnswer > -1)
        {
            let answer = this.currentQuizSession.quiz[this.questionContentIndex].selectedAnswer;
            if(this.currentQuizSession.quiz[this.questionContentIndex].displayType == 2)
            {    
                return answer == 0 ? "Yes" : "No";
            }
            else if(this.currentQuizSession.quiz[this.questionContentIndex].displayType == 1) {
                let answer = this.currentQuizSession.quiz[this.questionContentIndex].selectedAnswer; 
                let p = "Sign ";
                switch (answer) {
                    case 0:
                        return p += '1';
                    case 1:
                        return p += '2';
                    case 2:
                        return p += '3';            
                    default:
                        return "None";
                }
            }
            else if(this.currentQuizSession.quiz[this.questionContentIndex].displayType == 0) {
                let quest = this.currentQuizSession.quiz[this.questionContentIndex];
                for (let index = 0; index < quest.answerOptions.length; index++) {
                    if(index == quest.selectedAnswer)
                        return quest.answerOptions[index];
                }
            }        
        }
        return "None";
    }

    constructor(injector: Injector, 
        private messageService: MessageService,
        private theoryPracticeHelperService: SVTheoryPracticeHelperService,
        private theoryExamService: TheoryExamsServiceProxy,
        private router: Router) {        
        super(injector);
    }

    canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
        console.log("check can Deactivate");
        if(!this.quizFinished && this.currentQuizSession != null)
        {
            this.message.confirm('Discard answers from this sheet?', (isConfirmed) => {
                if (isConfirmed) {
                    console.log("navigated away from TheoryPracticeQuiz");                   
                    this.navigateAwaySelection.next(isConfirmed);                       
                }
                else {                                    
                    console.log("navigation: return to TheoryPracticeQuiz");
                }
            });
            return this.navigateAwaySelection;
        }
        else 
        {
            return true;
        }
    }

    ngOnInit(): void {      
        let quizId = this.theoryPracticeHelperService.quizId;
        this.getQuestionSeries(quizId);

        if(this.currentQuizSession)
        {          
            this.startQuiz();
        }
        else
        {
            console.log("Warning: No quizId, navigate back and select again");
            this.router.navigateByUrl("/app/main/studentsView/theoryPractice");
        }
              
        /*this.currentQuizSession = new QuizSession(true, 30);   
        this.currentQuizSession.quiz = this.dummyContent;
        this.currentQuizSession.maxErrorsLicenceClassQuestions = 2;
        this.currentQuizSession.maxErrorsRiskQuestions = 1;
        this.currentQuizSession.maxErrorsSituationQuestions = 2;  
        this.startTimer(this.currentQuizSession.duration);
        */       
    }

    getQuestionSeries(id : string) {
        let res;
        this.theoryExamService.getQuestionSeries(0).subscribe(
           (result) => {res = result}                       
        );

        if(res != null)
        {
            this.getQuestionSeries(res);
        }      
    }

    generateQuiz(questions: QuestionDto[]) {
        let quiz : TheoryExamQuestion[] = [];
        for (let index = 0; index < questions.length; index++) {
            let currentQuestion = questions[index];
            let parsedQuestion : TheoryExamQuestion;
            switch (currentQuestion.type) {
                case 0: // TrafficSituation
                    parsedQuestion.displayType = 2;
                    parsedQuestion.contentType = 1;               
                    parsedQuestion.pictureUrl = currentQuestion.singleChoiceAnswer.imageUrl;                
                break;
                case 1: // ClassRelated
                    parsedQuestion.displayType = 0;
                    parsedQuestion.contentType = 0;                    
                break;
                case 2: // RiskIdentifying
                    parsedQuestion.displayType = 0;
                    parsedQuestion.contentType = 2;                   
                    parsedQuestion.pictureUrl = currentQuestion.singleChoiceAnswer.imageUrl;                
                break;
                case 3: // Other --> PictureQuestion
                    parsedQuestion.displayType = 1;
                    parsedQuestion.contentType = 1;
                break;
                          
                default:
                    break;     
            }   
            
            parsedQuestion.correctAnswer = currentQuestion.singleChoiceAnswer.correctAnswer;                      
            parsedQuestion.answerOptions.push(currentQuestion.singleChoiceAnswer.answer1);
            parsedQuestion.answerOptions.push(currentQuestion.singleChoiceAnswer.answer2);
            parsedQuestion.answerOptions.push(currentQuestion.singleChoiceAnswer.answer3);
            parsedQuestion.quest = currentQuestion.questionString;
            quiz.push(parsedQuestion);
        }

        this.currentQuizSession = new QuizSession();
        this.currentQuizSession.quiz = quiz;

        for (let index = 0; index < this.currentQuizSession.quiz.length; index++) {
            this.questionPageButtons.push({class: 'disabledPageButton', disabled: true});          
        }
        this.changeButtonStyle(0, "selectedPageButton"); 
    }

    onFinishQuiz() { 
        this.message.confirm("Otherwise continue with results.", 'Do you want to change your answers?',
            (isConfirmed) => {
            if (isConfirmed) {  
                this.correctQuiz();                             
            }  
            else {
                this.finishQuiz();
            }               
        });                           
    }

    startQuiz() {       
        this.currentQuizSession.duration = this.theoryPracticeHelperService.quizDuration;
        this.currentQuizSession.isMarkable = this.theoryPracticeHelperService.quizMarkable;
        this.currentQuizSession.maxErrorsLicenceClassQuestions = this.theoryPracticeHelperService.maxErrorsLicenseClassQuestions;
        this.currentQuizSession.maxErrorsRiskQuestions = this.theoryPracticeHelperService.maxErrorsRiskIdentifyingQuestions;
        this.currentQuizSession.maxErrorsSituationQuestions = this.theoryPracticeHelperService.maxErrorsTrafficSituationQuestions;
        this.currentQuizSession.selectedQuestion = 1;
        this.currentQuizSession.incorrectQuestions = [];
        this.startTimer(this.currentQuizSession.duration);
          
    }

    finishQuiz() {
        this.evaluateAnswers();
        console.log("data to server, show reults");
        this.toggleQuizNavigation(false);
        this.quizFinished = true;
    }  

    correctQuiz() {      
        this.currentQuizSession.isMarkable = false; 
        this.toggleQuizNavigation(true);
    }

    onPageClicked(index: number) {
        if(this.currentQuizSession != null )
        {        
            this.currentQuizSession.selectedQuestion = index+1;
            this.changeAllButtonStyles(true, "defaultPageButton");
            this.loadSelectedAnswer();
        }
    }

    loadSelectedAnswer() {       
        this.selectedOption = this.currentQuizSession.quiz[this.questionContentIndex].selectedAnswer;    
        //console.log("buttons: " + this.picButton01 + " ," + this.picButton02 + " ," + this.picButton03 );
        if(this.picButton01 != null)
        {
            if(this.selectedOption == 0)   
                this.picButton01.nativeElement.focus(); 
            else if(this.selectedOption == 1)   
                this.picButton02.nativeElement.focus(); 
            else if(this.selectedOption == 2)   
                this.picButton03.nativeElement.focus(); 
        }  
    }

    onNextPageClicked() {
        if(this.currentQuizSession != null &&  this.currentQuizSession.selectedQuestion < this.questionPageButtons.length)
        {
            this.currentQuizSession.selectedQuestion += 1;
            this.changeAllButtonStyles(true, "defaultPageButton");
            this.loadSelectedAnswer();
        }
    }

    onPreviousPageClicked() {
        if(this.currentQuizSession != null &&  this.currentQuizSession.selectedQuestion > 1) {
            this.currentQuizSession.selectedQuestion -= 1;
            this.changeAllButtonStyles(true, "defaultPageButton");
            this.loadSelectedAnswer();
        }
    }

    markQuestion() {
        this.markedQuestionPages.push(this.currentQuizSession.selectedQuestion);
        this.changeButtonStyle(this.currentQuizSession.selectedQuestion, "markedPageButton");  
        this.nextPage(true)
    }

    nextPage(markCurrentPage: boolean): void { 
        if(!this.selectMarkedQuestions)
        {
            this.checkTrafficSituationNotification();
            let x = this.currentQuizSession.selectedQuestion + 1;
            if(x > this.currentQuizSession.quiz.length) // end reached
            {
                if(this.currentQuizSession.isMarkable && this.markedQuestionPages.length > 0)
                {
                    this.selectMarkedQuestions = true;
                    this.changeButtonStyle(this.currentQuizSession.selectedQuestion, "disabledPageButton");
                    this.nextMarkedPage();               
                }
                else {
                    this.onFinishQuiz();
                    this.changeButtonStyle(this.currentQuizSession.selectedQuestion, "selectedPageButton");
                }
            }
            else{
                this.currentQuizSession.selectedQuestion = x; 
                if(!markCurrentPage)                
                    this.changeButtonStyle(this.currentQuizSession.selectedQuestion-1, "disabledPageButton");               
                this.changeButtonStyle(this.currentQuizSession.selectedQuestion, "selectedPageButton");
            }  
        } 
        else
        {           
            if(this.markedQuestionPages.length > 0)
            {
                console.log("show next marked question");
                if(!markCurrentPage)
                    this.changeButtonStyle(this.markedQuestionPages[0], "disabledPageButton");
                this.markedQuestionPages.splice(0, 1);               
            }
            this.nextMarkedPage(); 
        }
        this.selectedOption = -1;
    }

    nextMarkedPage() {
        if(this.markedQuestionPages.length < 1)
        {
            this.selectMarkedQuestions = false;
            console.log("end of marked questions reached: end quiz?");
            this.changeButtonStyle(this.currentQuizSession.selectedQuestion, "selectedPageButton");
            this.onFinishQuiz();
        }
        else {
            this.currentQuizSession.selectedQuestion = this.markedQuestionPages[0]; 
            this.changeButtonStyle(this.markedQuestionPages[0], "selectedPageButton");         
        }
        
    }

    setQuestionAnswerRadioButton(value : number) {
        if(this.dummyContent)
        {
            //console.log("set answer to: " + value);
            this.dummyContent[this.questionContentIndex].selectedAnswer = value;           
        }
    }

    setQuestionAnswerSelectButton(event: any) {
        if(this.dummyContent)
        {
            //console.log("set answer to: " + event.value + " " + event.value.value.binary + "selected option: " + this.selectedOption);
            this.dummyContent[this.questionContentIndex].selectedAnswer = event.value.value.binary;                         
        }
    }

    setQuestionAnswerPictureButton(value : number) {
        if(this.dummyContent)
        {
            //console.log("(pic) set answer to: " + value);
            this.dummyContent[this.questionContentIndex].selectedAnswer = value;           
        }
    }

    evaluateAnswers() {
        let showCatErrors = this.currentQuizSession.maxErrorsLicenceClassQuestions ? true : false;
        let errorsLicenceClass = 0; let errorsRisk = 0; let errorsSituation = 0;
        let correctLicenceClass = 0; let correctRisk = 0; let correctSituation = 0;
        
        for (let index = 0; index < this.currentQuizSession.quiz.length; index++) {
            let q = this.currentQuizSession.quiz[index];
            if(q.selectedAnswer != q.correctAnswer ) {
                this.currentQuizSession.incorrectQuestions.push(q);

                if(showCatErrors)
                {
                    switch (q.contentType) {
                        case 0:
                            errorsLicenceClass++;
                            break;
                        case 1:
                            errorsSituation++;
                            break;
                        case 2: 
                            errorsRisk++;  
                            break;                         
                        default:
                            break;
                    }                  
                }
            }
            else {
                if(showCatErrors)
                {
                    switch (q.contentType) {
                        case 0:
                            correctLicenceClass++;
                            break;
                        case 1:
                            correctSituation++;
                            break;
                        case 2: 
                        correctRisk++;  
                            break;                         
                        default:
                            break;
                    }                  
                }
            }            
        }

        let evaluation: EvaluatedQuiz = {
            incorrectQuestions : this.currentQuizSession.incorrectQuestions,
            correctAnswersTotal : (this.currentQuizSession.quiz.length - 
                this.currentQuizSession.incorrectQuestions.length),
            questionsTotal: this.currentQuizSession.quiz.length,
            showCategoryErrors: showCatErrors
        };

        if(showCatErrors)
        {
            evaluation.errorsLicenceClassQuestions = errorsLicenceClass;
            evaluation.totalLicenceClassQuestions = this.currentQuizSession.numberOfLicenceClassQuestions();
            evaluation.correctLicenceClassQuestions = correctLicenceClass;

            evaluation.errorsRiskQuestions = errorsRisk;
            evaluation.totalRiskQuestions = this.currentQuizSession.numberOfRiskIdentifyingQuestions();
            evaluation.correctRiskQuestions = correctRisk;

            evaluation.errorsSituationQuestions = errorsSituation;
            evaluation.totalSituationQuestions = this.currentQuizSession.numberOfSituationQuestions();
            evaluation.correctSituationQuestions = correctSituation;

            evaluation.quizPassed = evaluation.errorsLicenceClassQuestions <= this.currentQuizSession.maxErrorsLicenceClassQuestions &&
                evaluation.errorsSituationQuestions <= this.currentQuizSession.maxErrorsSituationQuestions &&
                evaluation.errorsLicenceClassQuestions <= this.currentQuizSession.maxErrorsLicenceClassQuestions ?
                true : false;
        }

        this.currentResults = evaluation;
    }

    getMarkedQuestionsToString() : string {
        let s = "";
        for (let index = 0; index < this.markedQuestionPages.length; index++) {
            s += this.markedQuestionPages[index].toString(); 
            if(index != this.markedQuestionPages.length-1)
                s += ", "                  
        }
        return s;
    }

    startTimer(timeInMinutes : number) {        
        this.timerProgress = this.timerMax = (timeInMinutes * 60);
        this.timerMinutes = timeInMinutes; 
        this.timerSeconds = 60;
        let intervalId = setInterval(() => {
          let currMod : number = this.timerProgress % 60;
          this.checkProgressBarColor(this.timerProgress, this.timerMax);
          if(currMod === 0)
            {
              this.timerMinutes--;
              this.timerSeconds = 60;
            }
            this.timerProgress = this.timerProgress-1; 
            this.timerSeconds = this.timerSeconds-1;          
            
            if(this.timerProgress === 0)
            { 
              clearInterval(intervalId);
              this.finishQuiz();
            }          
        }, 1000);
        //console.log("start timer... " + intervalId);
    }

    checkProgressBarColor(progressOfTime: number, timerMax: number) {
        if(progressOfTime < (timerMax*0.4) && progressOfTime > (timerMax*0.15))
        {
            this.progressBarType = "warning";
        }
        else if(progressOfTime < (timerMax*0.15))
        {
            this.progressBarType = "danger";
        }
    }

    toggleQuizNavigation(enable : boolean) {
        if(enable)
        {           
            this.showDirectionalLinks = true;      
            this.changeAllButtonStyles(true, "defaultPageButton");
            
        }
        else {           
            this.showDirectionalLinks = false;       
            this.changeAllButtonStyles(true, "disabledPageButton");  
        }
    }

    changeButtonStyle(targetIndex: number, styleClass: string) {
        targetIndex = targetIndex-1 < 0 ? 0 : targetIndex-1 ; // convert to index
        let disabled = styleClass === "defaultPageButton" ?
            null : 'disabled';
        
        if(targetIndex > this.questionPageButtons.length-1)       
            console.log("Quiz: Warning! Something went wrong changing question buttons style");
        
        this.questionPageButtons[targetIndex].class = styleClass;
        this.questionPageButtons[targetIndex].disabled = disabled;
    }

    changeAllButtonStyles(exceptSelected: boolean, style: string)
    {
        for (let index = 0; index <= this.questionPageButtons.length; index++) {
            if(exceptSelected && index == this.currentQuizSession.selectedQuestion)
                this.changeButtonStyle(index, "selectedPageButton");
            else 
                this.changeButtonStyle(index, style);
        }
    }

    addSingleToast(title: string, description: string) {
        this.messageService.add({key:'trafficSituationToast', severity:'info', summary: title, detail: description});
    }

    clearToast() {
        this.messageService.clear();
    }

    checkTrafficSituationNotification() {
        let currentQuestion = this.currentQuizSession.getCurrentQuestion();
        let nextQuestion = this.currentQuizSession.getNextQuestion();
       
        /*let debug = true;
        if(debug)
        {
            this.addSingleToast("toast works");
        }*/
        if(nextQuestion != null)
        {
            if(currentQuestion.contentType != nextQuestion.contentType)
            {
                if(nextQuestion.contentType == 1)
                    this.addSingleToast("Next traffic situation exercices.",  "First claim: " + nextQuestion.quest);
            }
            else {
                if(currentQuestion.quest != nextQuestion.quest && nextQuestion.contentType == 1)
                    this.addSingleToast("Next traffic situation.", "Claim: " + nextQuestion.quest);
            }               
        }
    }

    getQuizSubtitle() : string {
        if(this.currentQuizSession)
        {
            if(!this.quizFinished)
            {
                let currQuestion = this.currentQuizSession.getCurrentQuestion();
                switch (currQuestion.contentType) {
                    case 0:
                        return "Licence class question";              
                    case 1:
                        return "Traffic situation question";              
                    case 2:
                        return "Risk identifying question";                          
                    default:
                        break;
                }
            }
            else {
                return "Results";
            } 
        }
    else return "No Quiz"   ;
    }

}
