import { Component, ViewChild, Injector, Output, EventEmitter, OnInit} from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';
import { AppointmentsServiceProxy, CreateOrEditAppointmentDto, AppointmentDto } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import * as moment from 'moment';
import { TimepickerComponent } from 'ngx-bootstrap/timepicker';
import { StudentLookupTableModalComponent } from '@app/shared/common/lookup/student-lookup-table-modal.component';
import { InstructorLookupTableModalComponent } from '@app/shared/common/lookup/instructor-lookup-table-modal.component';

@Component({
    selector: 'createOrEditEventModal',
    templateUrl: './create-or-edit-event-modal.component.html',
})
export class CreateOrEditEventModalComponent extends AppComponentBase implements OnInit{

    @ViewChild('createOrEditModal') modal: ModalDirective;
    @ViewChild('studentLookupTableModal') studentLookupTableModal : StudentLookupTableModalComponent;
    @ViewChild('instructorLookupTableModal') instructorLookupTableModal : InstructorLookupTableModalComponent;

    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    ismeridian: boolean = false;

    active = false;
    saving = false;
    startTime: Date = new Date();
    endTime: Date = new Date();
    event: CreateOrEditAppointmentDto = new CreateOrEditAppointmentDto();

    currentInstructorFullName: string = '';

    studentFullName = '';
    studentFirstName = '';
    studentLastName = '';

    personId: number;

    personSelected : boolean;
    studentSelected : boolean;
    instructorSelected : boolean;
    userSelected : boolean;
    disallowPersonSelection:boolean;

    dropdownListIds = [];
    dropdownList = [];
    selectedItems = [];
    dropdownSettings = {};

    constructor(
        injector: Injector,
        private _appointmentsServiceProxy: AppointmentsServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
        this.dropdownSettings = {
            singleSelection: false,
            idField: 'item_id',
            textField: 'item_text',
            selectAllText: 'Select All',
            unSelectAllText: 'Unselect All',
            allowSearchFilter: false
        };

        this.ismeridian = false;
    }

    onItemSelect(item: any) {
        console.log(item);
    }

    onSelectAll(items: any) {
        console.log(items);
    }

    show(eventId?: number): void {

        this.studentSelected = false;
        this.instructorSelected = false;
        this.userSelected = false;
        this.personSelected = false;
        this.personId = null;
        this.disallowPersonSelection = false;

        if (!eventId) {
            this.event = new CreateOrEditAppointmentDto();
            this.event.id = eventId;

            this.endTime = new Date(this.startTime);
            this.endTime.setHours(this.endTime.getHours() + 1);

            this.event.startTime = moment().startOf('day');
            this.event.endTime = moment().startOf('day').add(60);
            // this.drivingLessonTopic = '';
            // this.licenseClass = '';
            // this.studentFirstName = '';

            this.active = true;
            //this.updateInstructors(false);

            this.modal.show();
        } else {
            this._appointmentsServiceProxy.getAppointmentForEdit(eventId).subscribe(result => {
                this.event = result.appointment;
                // this.drivingLessonTopic = result.drivingLesson.topic;
                // this.licenseClass = result.drivingLesson.licenseClass;
                // this.studentFirstName = result.studentFirstName;
                this.startTime = result.appointment.startTime.toDate();
                this.endTime = result.appointment.endTime.toDate();
                this.personId = result.appointment.personId;
                this.personSelected = true;
                this.disallowPersonSelection = true;

                this.active = true;
                this.updateInstructors(true);
                this.modal.show();
            });
        }
    }

    save(): void {
            this.saving = true;

            //this.event.topic = this.drivingLessonTopic;

            //this.drivingLesson.instructors = [];
          
            this.event.startTime = moment(this.startTime);
            this.event.endTime = moment(this.endTime);

            this.event.startTime.hours(this.startTime.getHours());
            this.event.startTime.minutes(this.startTime.getMinutes());
            this.event.endTime.hours(this.endTime.getHours());
            this.event.endTime.minutes(this.endTime.getMinutes());

            this.event.personId = this.personId;
            
            // for (var instructor of this.selectedItems)
            // {
            //     var i = new InstructorDto();
            //     i.id = this.dropdownListIds[instructor.item_id];
            //     this.drivingLesson.instructors.push(
            //         i
            //     );
            //     console.log(i.id);
            // }
	
            this._appointmentsServiceProxy.createOrEdit(this.event)
             .pipe(finalize(() => { this.saving = false;}))
             .subscribe(() => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
             });
    }

    updateInstructors(drivingLessonEdit : boolean ) : void
    {
        // console.log(this.active);
        // if (!this.active) {
        //     return;
        // }

        // this.primengTableHelper.showLoadingIndicator();

        // this._appointmentsServiceProxy.getAllInstructorForLookupTable(
        //     "",
        //     "",
        //     0,
        //     1000).subscribe(result => {
        //         console.log("in");
        //         // for(var r = 0; r < result.items.length; r++)
        //         //     console.log(result.items[r].id);
    
        //         this.dropdownList = [];
        //         this.dropdownListIds = [];
        //         this.selectedItems = [];

        //         for (var _i = 0; _i < result.items.length; _i++) 
        //         {   
        //             this.dropdownList.push(
        //             {
        //                 item_id: _i, 
        //                 item_text: result.items[_i].displayName
        //             });

        //             this.dropdownListIds.push(result.items[_i].id);
        //         }

        //         if(drivingLessonEdit)
        //         {
        //             for (var item of this.dropdownList) {
        //                 console.log(this.drivingLesson.instructors.length);
        //                 for (var instructor of this.drivingLesson.instructors) {
        //                     console.log(instructor.id);
        //                     console.log(this.dropdownListIds[item.item_id]);
        //                     if(this.dropdownListIds[item.item_id] == instructor.id)
        //                     {
        //                         console.log("Add it now" + instructor.id);
        //                         this.selectedItems.push(
        //                             {
        //                                 item_id: item.item_id,
        //                                 item_text: item.item_text
        //                             }
        //                         );
        //                     }
        //                 }
                        
        //             }

        //             //console.log(this.selectedItems.length);
        //         }

        //         this.primengTableHelper.hideLoadingIndicator();
        //     });
    }

    delete(): void{
        this.message.confirm(
            '',
            (isConfirmed) => {
                if (isConfirmed) {
                    this._appointmentsServiceProxy.delete(this.event.id)
                        .subscribe(() => {
                            this.notify.success(this.l('SuccessfullyDeleted'));
                            this.close();
                            this.modalSave.emit(null);
                        });
                }
            }
        );
    }

    personTypeSelected(n : number)
    {
        if(n == 0)
        {
            this.studentSelected = true;
            this.instructorSelected = false;
            this.userSelected = false;
        }

        if(n == 1)
        {
            this.studentSelected = false;
            this.instructorSelected = true;
            this.userSelected = false;
        }

        if(n == 2)
        {
            this.studentSelected = false;
            this.instructorSelected = false;
            this.userSelected = true;
        }
    }

    close(): void {
        this.active = false;
        this.modal.hide();
    }

    setInstructorNull() {
        this.personId = null;
        this.currentInstructorFullName = '';
        this.personSelected = false;
    }


    getNewInstructorId() {
        this.personId = this.instructorLookupTableModal.id;
      
        if(this.personId != null)
        {
            this.currentInstructorFullName = this.instructorLookupTableModal.firstName + ' ' + this.instructorLookupTableModal.lastName;
            this.personSelected = true;
        }
        else
        {
            this.currentInstructorFullName = "";
        }
    }

    openSelectInstructorModal() {
        this.instructorLookupTableModal.show();
    }

    setStudentIdNull() {
        this.studentFirstName = '';
        this.studentLastName = '';
        this.personId = null;
        this.refreshStudentFullName();
        this.personSelected = false;
    }

    openSelectStudentModal() {
        this.studentLookupTableModal.firstName = this.studentFirstName;
        this.studentLookupTableModal.lastName = this.studentLastName;
        this.refreshStudentFullName();
        this.studentLookupTableModal.show();
    }

    getNewStudentId() {

        this.personId = this.studentLookupTableModal.id;

        if(this.personId != null)
        {
            this.studentFirstName = this.studentLookupTableModal.firstName;
            this.studentLastName = this.studentLookupTableModal.lastName;
            this.refreshStudentFullName();
            this.personSelected = true;
        }

        else
        {
            this.studentFirstName = "";
            this.studentLastName = "";
            this.refreshStudentFullName();
        }
    }

    refreshStudentFullName() {
        this.studentFullName = this.studentFirstName + ' ' + this.studentLastName;
    }
}
