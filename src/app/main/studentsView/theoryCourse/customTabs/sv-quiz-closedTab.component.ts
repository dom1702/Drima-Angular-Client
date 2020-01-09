import { Component, ViewEncapsulation, Input, Injector, OnInit, ViewChild, Output, EventEmitter} from "@angular/core";
import { appModuleAnimation } from "@shared/animations/routerTransition";
import * as moment from 'moment';
import {Message, MessageService} from 'primeng//api';
import { AppComponentBase } from "@shared/common/app-component-base";
import {CheckboxModule} from 'primeng/checkbox';

@Component({
    templateUrl: './sv-quiz-closedTab.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [appModuleAnimation()],
    selector: 'closedTab',
    providers:[MessageService]
})

export class SVQuizClosedTabComponent extends AppComponentBase implements OnInit {
   
    closedMessage : Message[] = [];
    abortedMessage : Message[] = [];
    _aborted : boolean;
    selectedPhoneNumber: string[] = ['123456'];
    checked : boolean = false;

    @Output() 
    abortedChanged = new EventEmitter();

    @Input()
    closingTime : moment.Moment;

    @Input()
    openingDays : moment.Moment[];

    @Input()
    closed : boolean;

    @Input()
    get aborted() : boolean {
        return this._aborted;
    };
    set aborted(value : boolean) {
        if(value != this._aborted)
        {
            this._aborted = value;       
            this.abortedChanged.emit(this._aborted);
        }
    }
     
    constructor(private injector: Injector) {       
        super(injector);             
    }

    ngOnInit(): void {
        console.log("cl: " + this.closed + "  ch: " + this.checked); 
        if(this.aborted)
            this.show("error", "The eLesson has been cancelled and has to be started again.", this.abortedMessage);
        else
            this.abortedMessage = [];

        if(this.closed)
        {
            this.show("error", "The lesson room is closed.", this.closedMessage);
        }
        else this.show("info", "The Drima control room is open today " +  this.closingTime.format("HH.mm") + ".", this.closedMessage);      
    }

    show(intention: string, message : string, msg : Message[]) {
        msg.push({severity: intention, summary: message});
    }

    disableAborted() {
        this.aborted = false;
    }

    isClosedAndInformed() : boolean {
        return ;
    }
}