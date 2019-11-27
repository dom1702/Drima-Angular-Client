import { Component, ViewEncapsulation, Injector, Input, Output, EventEmitter } from "@angular/core";
import { appModuleAnimation } from "@shared/animations/routerTransition";
import { AppComponentBase } from "@shared/common/app-component-base";
import {Message} from 'primeng//api';
import { RadioButton } from "primeng/primeng";


@Component({
    templateUrl: './sv-question.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()],
    selector: 'question'
})

export class SVQuestionComponent extends AppComponentBase{

    @Output()
    valueSelected : EventEmitter<string> = new EventEmitter<string>();
    
    @Input()
    quest : string;

    @Input()
    nr: number;
  
    @Input()
    pictureUrl? : string;

    @Input()
    answerOptions : string[];

    @Input()
    correctAnswer : number;

    messages: Message[] = [];
    _selected : string;

    get selected(): string {
        return this._selected;
    }
    set selected(value: string)  {
        
        if(this.getAnswerResult() != value)
        {           
            this.showMessage("error", "Wrong!", "Try again");
        }
        else {
            this.showMessage("success", "Right!");
        }
        
        this._selected = value;
        this.valueSelected.emit(value);
    }
           
    constructor(injector: Injector) 
    {
        super(injector);
    }

    onClick(answer : string) : void {
        this.selected = answer;
    }

    public getAnswerResult() : string {
       if(this.answerOptions != null) 
       {      
            return this.answerOptions[this.correctAnswer].toString();
       }
       return "No answer options found!";
    }

    showMessage(_severity: string, _summary: string, _details?: string) {
       this.messages = [];
       this.messages.push({severity: _severity, summary: _summary, detail: _details})
    }

}