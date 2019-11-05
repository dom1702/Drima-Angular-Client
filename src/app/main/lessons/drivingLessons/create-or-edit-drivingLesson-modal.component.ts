import { Component, ViewChild, Injector, Output, EventEmitter, OnInit } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';
import { DrivingLessonsServiceProxy, CreateOrEditDrivingLessonDto, InstructorDto, InstructorsOwnDrivingLessonsServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import * as moment from 'moment';
import { DrivingLessonTopicLookupTableModalComponent } from './drivingLessonTopic-lookup-table-modal.component';
import { DLLicenseClassLookupTableModalComponent } from '../../../shared/common/lookup/drivingLesson-licenseClass-lookup-table-modal.component';
import { DLStudentLookupTableModalComponent } from './drivingLesson-student-lookup-table-modal.component';
import { TimepickerComponent } from 'ngx-bootstrap/timepicker';
import { VehicleLookupTableModalComponent } from '@app/shared/common/lookup/vehicle-lookup-table-modal.component';

@Component({
    selector: 'createOrEditDrivingLessonModal',
    templateUrl: './create-or-edit-drivingLesson-modal.component.html',
})
export class CreateOrEditDrivingLessonModalComponent extends AppComponentBase implements OnInit {

    @ViewChild('createOrEditModal') modal: ModalDirective;
    @ViewChild('drivingLessonTopicLookupTableModal') drivingLessonTopicLookupTableModal: DrivingLessonTopicLookupTableModalComponent;
    @ViewChild('licenseClassLookupTableModal') licenseClassLookupTableModal: DLLicenseClassLookupTableModalComponent;
    @ViewChild('studentLookupTableModal') studentLookupTableModal: DLStudentLookupTableModalComponent;
    @ViewChild('vehicleLookupTableModal') vehicleLookupTableModal: VehicleLookupTableModalComponent;


    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    ismeridian: boolean = false;

    active = false;
    saving = false;
    startTime: Date = new Date();
    drivingLesson: CreateOrEditDrivingLessonDto = new CreateOrEditDrivingLessonDto();

    drivingLessonTopic = '';
    licenseClass = '';
    studentFirstName = '';
    studentLastName = '';
    studentFullName = '';

    vehicleName = '';

    instructorPersonalLesson: boolean;
    instructorId?: number;

    dropdownListIds = [];
    dropdownList = [];
    selectedItems = [];
    dropdownSettings = {};

    constructor(
        injector: Injector,
        private _drivingLessonsServiceProxy: DrivingLessonsServiceProxy,
        private _instructorsOwnDrivingLessonsServiceProxy: InstructorsOwnDrivingLessonsServiceProxy
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

    show(drivingLessonId?: number, instructorPersonalLesson: boolean = false): void {

        this.instructorPersonalLesson = instructorPersonalLesson;

        if (!drivingLessonId) {

            this.drivingLesson = new CreateOrEditDrivingLessonDto();
            this.drivingLesson.id = drivingLessonId;
            this.drivingLesson.startTime = moment().startOf('day');
            this.drivingLessonTopic = '';
            this.licenseClass = '';
            this.studentFirstName = '';
            this.studentLastName = '';
            this.vehicleName = '';
            this.drivingLesson.length = 1;
            this.drivingLesson.addingMinutesAfter = 0;
            this.refreshStudentFullName();

            this.active = true;
            this.updateInstructors(false);

            this.modal.show();
        } else if (this.instructorPersonalLesson) {
            this._instructorsOwnDrivingLessonsServiceProxy.getDrivingLessonForEdit(drivingLessonId).subscribe(result => {
                this.drivingLesson = result.drivingLesson;
                this.drivingLessonTopic = result.drivingLesson.topic;
                this.licenseClass = result.drivingLesson.licenseClass;
                this.studentFirstName = (result.studentFirstName == null) ? "" : result.studentFirstName;
                this.studentLastName = (result.studentLastName == null) ? "" : result.studentLastName;
                this.vehicleName = result.vehicleNameBrandModel;
                this.refreshStudentFullName();
                this.startTime = result.drivingLesson.startTime.toDate();

                this.active = true;
                this.updateInstructors(true);

                this.modal.show();
            });
        } else {
            this._drivingLessonsServiceProxy.getDrivingLessonForEdit(drivingLessonId).subscribe(result => {
                this.drivingLesson = result.drivingLesson;
                this.drivingLessonTopic = result.drivingLesson.topic;
                this.licenseClass = result.drivingLesson.licenseClass;
                this.studentFirstName = (result.studentFirstName == null) ? "" : result.studentFirstName;
                this.studentLastName = (result.studentLastName == null) ? "" : result.studentLastName;
                this.vehicleName = result.vehicleNameBrandModel;
                this.refreshStudentFullName();
                this.startTime = result.drivingLesson.startTime.toDate();

                this.active = true;
                this.updateInstructors(true);

                this.modal.show();
            });
        }
    }

    save(): void {
        this.saving = true;

        this.drivingLesson.topic = this.drivingLessonTopic;

        this.drivingLesson.instructors = [];

        //this.drivingLesson.startTime.date(this.startTime.getDay());
        this.drivingLesson.startTime = moment(this.startTime);
        this.drivingLesson.startTime.hours(this.startTime.getHours());
        this.drivingLesson.startTime.minutes(this.startTime.getMinutes());

        for (var instructor of this.selectedItems) {
            var i = new InstructorDto();
            i.id = this.dropdownListIds[instructor.item_id];
            this.drivingLesson.instructors.push(
                i
            );
            console.log(i.id);
        }

        if (this.instructorPersonalLesson) {
            this._instructorsOwnDrivingLessonsServiceProxy.createOrEdit(this.drivingLesson)
                .pipe(finalize(() => { this.saving = false; }))
                .subscribe(() => {
                    this.notify.info(this.l('SavedSuccessfully'));
                    this.close();
                    this.modalSave.emit(null);
                });
        }
        else {
            this._drivingLessonsServiceProxy.createOrEdit(this.drivingLesson)
                .pipe(finalize(() => { this.saving = false; }))
                .subscribe(() => {
                    this.notify.info(this.l('SavedSuccessfully'));
                    this.close();
                    this.modalSave.emit(null);
                });
        }
    }

    updateInstructors(drivingLessonEdit: boolean): void {
        console.log(this.active);
        if (!this.active) {
            return;
        }

        this.primengTableHelper.showLoadingIndicator();

        this._drivingLessonsServiceProxy.getAllInstructorForLookupTable(
            "",
            "",
            0,
            1000).subscribe(result => {
                console.log("in");
                // for(var r = 0; r < result.items.length; r++)
                //     console.log(result.items[r].id);

                this.dropdownList = [];
                this.dropdownListIds = [];
                this.selectedItems = [];

                for (var _i = 0; _i < result.items.length; _i++) {
                    this.dropdownList.push(
                        {
                            item_id: _i,
                            item_text: result.items[_i].displayName
                        });

                    this.dropdownListIds.push(result.items[_i].id);
                }

                if (drivingLessonEdit) {
                    for (var item of this.dropdownList) {
                        console.log(this.drivingLesson.instructors.length);
                        for (var instructor of this.drivingLesson.instructors) {
                            console.log(instructor.id);
                            console.log(this.dropdownListIds[item.item_id]);
                            if (this.dropdownListIds[item.item_id] == instructor.id) {
                                console.log("Add it now" + instructor.id);
                                this.selectedItems.push(
                                    {
                                        item_id: item.item_id,
                                        item_text: item.item_text
                                    }
                                );
                            }
                        }

                    }

                    //console.log(this.selectedItems.length);
                }

                this.primengTableHelper.hideLoadingIndicator();
            });
    }

    openSelectDrivingLessonTopicModal() {
        this.drivingLessonTopicLookupTableModal.id = 0;
        this.drivingLessonTopicLookupTableModal.displayName = this.drivingLessonTopic;
        this.drivingLessonTopicLookupTableModal.show();
    }
    openSelectLicenseClassModal() {
        //this.licenseClassLookupTableModal.id = this.drivingLesson.licenseClass;
        this.licenseClassLookupTableModal.displayName = this.licenseClass;
        this.licenseClassLookupTableModal.show();
    }

    openSelectVehicleModal() {
        //this.licenseClassLookupTableModal.id = this.drivingLesson.licenseClass;
        //this.vehicleLookupTableModal.displayName = this.licenseClass;
        this.vehicleLookupTableModal.show();
    }

    setVehicleNull() {
        this.drivingLesson.vehicleId = null;
        this.vehicleName = '';
    }

    setTopicNull() {
        this.drivingLesson.topic = null;
        this.drivingLessonTopic = '';
    }
    setLicenseClassNull() {
        this.drivingLesson.licenseClass = null;
        this.licenseClass = '';
    }

    setStudentIdNull() {
        this.drivingLesson.studentId = null;
        this.studentFirstName = '';
        this.studentLastName = '';
        this.refreshStudentFullName();
    }

    openSelectStudentModal() {

        this.studentLookupTableModal.id = this.drivingLesson.studentId;
        this.studentLookupTableModal.firstName = this.studentFirstName;
        this.studentLookupTableModal.lastName = this.studentLastName;
        this.refreshStudentFullName();
        this.studentLookupTableModal.show();
    }

    getNewStudentId() {

        this.drivingLesson.studentId = this.studentLookupTableModal.id;
        this.studentFirstName = this.studentLookupTableModal.firstName;
        this.studentLastName = this.studentLookupTableModal.lastName;
        this.refreshStudentFullName();
    }

    getNewTopic() {

        this.drivingLesson.topic = this.drivingLessonTopicLookupTableModal.displayName;
        this.drivingLesson.description = this.drivingLessonTopicLookupTableModal.description;
        this.drivingLessonTopic = this.drivingLessonTopicLookupTableModal.displayName;
    }
    getNewLicenseClass() {
        this.drivingLesson.licenseClass = this.licenseClassLookupTableModal.displayName;
        this.licenseClass = this.licenseClassLookupTableModal.displayName;
    }

    getNewVehicle() {
        this.drivingLesson.vehicleId = this.vehicleLookupTableModal.id;
        this.vehicleName = this.vehicleLookupTableModal.name + ' ( ' + this.vehicleLookupTableModal.brand + ' ' + this.vehicleLookupTableModal.model + ')';
    }

    refreshStudentFullName() {
        this.studentFullName = this.studentFirstName + ' ' + this.studentLastName;
    }

    delete(): void {
        this.message.confirm(
            '',
            (isConfirmed) => {
                if (isConfirmed) {

                    if (this.instructorPersonalLesson) {
                        this._instructorsOwnDrivingLessonsServiceProxy.delete(this.drivingLesson.id)
                            .subscribe(() => {
                                this.notify.success(this.l('SuccessfullyDeleted'));
                                this.close();
                                this.modalSave.emit(null);
                            });
                    } else {
                        this._drivingLessonsServiceProxy.delete(this.drivingLesson.id)
                            .subscribe(() => {
                                this.notify.success(this.l('SuccessfullyDeleted'));
                                this.close();
                                this.modalSave.emit(null);
                            });
                    }
                }
            }
        );
    }

    close(): void {
        this.active = false;
        this.modal.hide();
    }
}
