import { Component, ViewChild, Injector, OnInit, ViewEncapsulation, AfterViewInit, Output, OnChanges } from "@angular/core";
import { AppComponentBase } from "@shared/common/app-component-base";
import { appModuleAnimation } from "@shared/animations/routerTransition";
import { TabsetComponent, TabDirective } from "ngx-bootstrap";
import {MessageService} from 'primeng/api';
import { SVQuestionComponent } from "./sv-question.component";

class Question {
    quest: string;
    nr : number;
    picture? : string;
    answerOptions : string[];
    correctAnswer : number;

    /*public getAnswerResult() : string {
       if(this.answerOptions != null) 
       {      
            return this.answerOptions[this.correctAnswer];
       }
       return "No answer options found!";
   }*/
}

class QuizContent {
    id : number;
    title: string;
    mandatoryTime: number;
    videoUrl? : string;
    questions? : SVQuestionComponent[];
}

@Component({
    templateUrl: './sv-quiz.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()]
})

export class SVQuizComponent extends AppComponentBase implements OnInit, AfterViewInit {
               
    dummyData : any[] = [
        {
            id: 0,
            title: 'Test Video 1',
            mandatoryTime: 600000,
            content: ["https://www.youtube.com/watch?v=sCmKw-Zqbj0"]
        },
        {
            id: 1,
            title: 'Test Questions 1',
            mandatoryTime: 120000,
            content : [{
                quest: 'Complete the row: ABC',
                nr : 1,
                answerOptions : ['F', 'X', 'D'] ,
                correctAnswer : 2         
            },
            {              
                quest: 'Add 2 to 16',
                nr : 2,
                answerOptions : ['14', '18', '216'],
                correctAnswer : 1
            },
            {               
                quest: 'the glas is.. ',
                nr : 3,
                picture : "http://www.dadsonline.com.au/wp-content/uploads/glass-half-full.jpeg",
                answerOptions : ['Half-full', 'Half-empty', 'either or!'],
                correctAnswer : 2        
            }
            ],          
        },
        {
            id: 2,
            title: 'Test Video 2',
            mandatoryTime: 800000,
            content: ["https://www.youtube.com/watch?v=2VqlRsJud9U"]
        }
    ];

    @ViewChild('quizTabs')
    quizTabs : TabsetComponent;

    @ViewChild('homeTab')
    homeTab : TabDirective;

    tabsData : any[] = []; // read data from dummyData into a sturct that can be red by the template
    progress : number = 0;
    selectedValue: string = null;

    constructor(injector: Injector) 
    {
        super(injector);
    }

    ngOnInit(): void {
        console.debug("on init: " + this.quizTabs.tabs.length);

        for (let index = 0; index < this.dummyData.length; index++) {
            this.addTabData("Part " + (index + 1), 
                true,
                false,
                this.dummyData[index].id.toString(),
                this.dummyData[index].title, 
                this.dummyData[index].mandatoryTime,
                this.dummyData[index].content);         
        }           
    }

    ngAfterViewInit(): void {
        console.debug("on afterViewInit: " + this.quizTabs.tabs.length);

        let homeTab = this.quizTabs.tabs[1];
        this.quizTabs.tabs.splice(1,1);
        this.quizTabs.tabs.push(homeTab);
    }

    onSelect(data : TabDirective) : void {
        if(data.id == "start") {
            console.log("Start tab pressed -> load saved sesson tab or closed tab");
            this.enableQuizPart(0);
        }
        else if(data.id == "cancel") {
            console.log("Cancel tab pressed -> return to quiz main page or show closed tab");
        }
    }

    close() : void {
       console.log("close clicked");
    }

    submitQuestion() {
        this.progress ++;
        this.enableQuizPart(this.progress);
    }

    enableQuizPart(progress: number) {
        if(progress > 0)
        {
            this.tabsData[progress-1].disabled = !this.tabsData[progress-1].disabled;
            this.tabsData[progress-1].active = !this.tabsData[progress-1].active;
        } 

        if(progress > this.tabsData.length-1)
        {
            console.log("end of quiz reached");
        }
        else
        {
            this.tabsData[progress].disabled = !this.tabsData[progress].disabled;
            this.tabsData[progress].active = !this.tabsData[progress].active;
        }             
    }

    addTabData(tabHeading: string, isDisabled : boolean, isActive, identifier: string, 
        contentTitle : string, mandTime: number,  tabContent : any[]): void {
        
        this.tabsData.push({
            heading : tabHeading, 
            disabled : isDisabled,
            active : isActive,
            id: identifier,
            title: contentTitle,
            mandatoryTime: mandTime,
            content : tabContent,
            });           
    }

}