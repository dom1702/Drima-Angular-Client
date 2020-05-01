import { appModuleAnimation } from "@shared/animations/routerTransition";
import { Component, Injector, Input } from "@angular/core";
import { AppComponentBase } from "@shared/common/app-component-base";
import { Message } from "primeng/api";
import { TheoryExamQuestion, QuestionType } from "./sv-licenseClassTasksOverview.component";

@Component({
    templateUrl: './sv-theoryPracticeResults.component.html',
    animations: [appModuleAnimation()],
    styleUrls: ['./sv-theoryPracticeResults.component.css'],
    selector: 'results'
})

export class SVTheoryPracticeResultsComponent extends AppComponentBase {
    
    overallResult : Message[] = [];
    
    @Input()
    wrongQuestions : TheoryExamQuestion[] = [{
        quest : 'I can turn straight using this lane',
        pictureUrl: 'https://s3.123fahrschule.de/fahrschule/prod/tuv/question-img/1.4.41-157.jpeg',
        answerOptions: ['yes', 'no'],
        correctAnswer: 1,
        type: 2,
        hint: "There is a bus dude!"
    },
    {
        quest : 'I can turn right using this lane',
        pictureUrl: 'https://s3.123fahrschule.de/fahrschule/prod/tuv/question-img/1.4.41-157.jpeg',
        answerOptions: ['yes', 'no'],
        correctAnswer: 0,
        type: 2
    },
    {
        quest : 'Why?',
        answerOptions: ['therefore!', 'dunno?', 'yolo!'],
        correctAnswer: 2,
        type: 0
    },
    {
        quest : 'Select the tree.',
        answerOptions: [
            'https://thorpetrees.com/wp-content/uploads/2013/11/oak-tree11.jpg',
             'https://i.ytimg.com/vi/KBXqxgGnghY/hqdefault.jpg',
              'https://img.etsystatic.com/il/32caaf/1331103981/il_340x270.1331103981_rsm5.jpg?version=1'
            ],
        correctAnswer: 0,      
        type: 1
    }];

    ngSwitch: QuestionType = 1;

    constructor(injector: Injector) {        
        super(injector);

        this.show("error", "Unfortunately you failed the test.");
    }

    show(targetSeverity: string, targetSummary: string, targetDetail?: string) {
        this.overallResult.push({severity:targetSeverity, summary:targetSummary, detail:targetDetail});
    }

    hide() {
        this.overallResult = [];
    }

    restartQuiz() {
        console.log("restart quiz");
    }   
}
