import { Component, ViewEncapsulation, Input, Injector, OnInit, Output, EventEmitter} from "@angular/core";
import { appModuleAnimation } from "@shared/animations/routerTransition";
import * as moment from 'moment';
import {Message, MessageService} from 'primeng//api';
import { AppComponentBase } from "@shared/common/app-component-base";

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
    requirementMessage : Message[] = [];
    videoTestButtonName : string = "Show video";
    showVideoTest : boolean = false;

    _aborted : boolean;
    studentPhoneNumber: number = 123456;
    checked : boolean = false;
    videoUrl : string = "https://player.vimeo.com/video/692568";

    @Output() 
    abortedChanged = new EventEmitter();

    @Input() 
    quizParts : number;

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

    get studentPhoneNumberParsed() : string {
        return this.studentPhoneNumber.toString();
    }   
    set studentPhoneNumberParsed(value : string) {
        let parsedNr = Number.parseInt(value);
        if(parsedNr.toFixed(0) == "NaN" || parsedNr == null ||  parsedNr.toFixed(0).length < 3)
        {
            //console.log("invalid phoneNR!");
            this.showToastError("Invalid phone number", "Saved phone number is set instead");
            this.studentPhoneNumber = this.studentPhoneNumber;
        }
        else {
            //console.log("set number! " + parsedNr);
            this.clearValidationError();
            this.studentPhoneNumber = parsedNr;
        }        
    }
     
    constructor(private injector: Injector, private messageService : MessageService) {       
        super(injector);             
    }

    toggleVideoTestBlock() : void {
        this.showVideoTest = !this.showVideoTest;
        if(this.showVideoTest == false)        
            this.videoTestButtonName = "Show video";      
        else
            this.videoTestButtonName = "Hide video";
    }

    ngOnInit(): void {
        //console.log("cl: " + this.closed + "  ch: " + this.checked); 
        if(this.aborted)
            this.show("error", "The eLesson has been cancelled and has to be started again.", this.abortedMessage);
        else
            this.abortedMessage = [];

        if(this.closed)
        {
            this.show("error", "The lesson room is closed.", this.closedMessage);
        }
        else this.show("info", "The Drima control room is open today " +  this.closingTime.format("HH.mm") + ".", this.closedMessage);      
   
        this.show("info", "eLesson requirements", this.requirementMessage, "The control room has to be able to contact you when needed. Check the number below and change it if needed. Check that the WhatsApp application is installed and running in the number below. The device, you are using for this eLesson, supports the media in it and the video format");
    }

    show(intention: string, message : string, msg : Message[], detail? : string) {
        msg.push({severity: intention, summary: message, detail: detail != null ? detail : ""});
    }

    showToastError(sum: string, det? : string) {
        this.messageService.clear("toast");
        this.messageService.add({key: "toast", severity:'error', summary: sum, detail: det != null ? det : ""});
    }

    clearValidationError() {
        this.messageService.clear('toast')
    }

    disableAborted() {
        let bfClosing = this.closingTime.clone().subtract(1 ,"hours");
               
        if(moment().isBetween(bfClosing, this.closingTime))
        {     
            this.showToastError("lesson room closes soon!", "try again tomorrow.")      
        }
        else{
            this.aborted = false;
        }
    }
}