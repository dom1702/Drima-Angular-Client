import { Component, ViewChild, Injector, Output, EventEmitter } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';
import { SimulatorLessonsServiceProxy, CreateOrEditSimulatorLessonDto, SimulatorLessonState } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import * as moment from 'moment';
import { SimulatorLessonPersonLookupTableModalComponent } from './simulatorLesson-person-lookup-table-modal.component';
import { SimulatorLessonSimulatorLookupTableModalComponent } from './simulatorLesson-simulator-lookup-table-modal.component';


@Component({
    selector: 'createOrEditSimulatorLessonModal',
    templateUrl: './create-or-edit-simulatorLesson-modal.component.html'
})
export class CreateOrEditSimulatorLessonModalComponent extends AppComponentBase {

    @ViewChild('createOrEditModal') modal: ModalDirective;
    @ViewChild('simulatorLessonPersonLookupTableModal') simulatorLessonPersonLookupTableModal: SimulatorLessonPersonLookupTableModalComponent;
    @ViewChild('simulatorLessonSimulatorLookupTableModal') simulatorLessonSimulatorLookupTableModal: SimulatorLessonSimulatorLookupTableModalComponent;


    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;

    simulatorLesson: CreateOrEditSimulatorLessonDto = new CreateOrEditSimulatorLessonDto();

    personLastName = '';
    simulatorName = '';

    simulatorModules;
    selectedModuleIdentifier;

    manuallyMarkCompleted : boolean = false;

    startTime: Date = new Date();

    constructor(
        injector: Injector,
        private _simulatorLessonsServiceProxy: SimulatorLessonsServiceProxy
    ) {
        super(injector);

        this.setSimulatorIdNull();
        this.selectedModuleIdentifier = null;
        this.simulatorModules = null;
        this.manuallyMarkCompleted = false;
    }

    show(simulatorLessonId?: number): void {

        if (!simulatorLessonId) {
            this.simulatorLesson = new CreateOrEditSimulatorLessonDto();
            this.simulatorLesson.id = simulatorLessonId;
            this.simulatorLesson.startTime = moment().startOf('day');
            this.personLastName = '';
            this.simulatorName = '';
            this.simulatorLesson.length = 1;

            this.active = true;
            this.modal.show();
        } else {
            this._simulatorLessonsServiceProxy.getSimulatorLessonForEdit(simulatorLessonId).subscribe(result => {

                this.simulatorLesson = result.simulatorLesson;

                var moduleIdentifierString = result.simulatorLesson.moduleIdentifier;

                if (this.simulatorLesson.simulatorId != null) {
                    this._simulatorLessonsServiceProxy.getAvailableModulesOnSimulator(this.simulatorLesson.simulatorId).subscribe(result => {
                        this.simulatorModules = result;
                        for(var i = 0; i< this.simulatorModules.availableModulesOnSim.length; i++)
                        {
                            if(this.simulatorModules.availableModulesOnSim[i].identifier == moduleIdentifierString)
                                this.selectedModuleIdentifier = this.simulatorModules.availableModulesOnSim[i];
                        }
                    })
                }

                this.personLastName = result.personLastName;
                this.simulatorName = result.simulatorName;
                this.startTime = result.simulatorLesson.startTime.toDate();

                this.active = true;
                this.modal.show();
            });
        }


    }

    save(): void {
        this.saving = true;

        this.simulatorLesson.startTime = moment(this.startTime);
        this.simulatorLesson.startTime.hours(this.startTime.getHours());
        this.simulatorLesson.startTime.minutes(this.startTime.getMinutes());
        this.simulatorLesson.moduleIdentifier = this.selectedModuleIdentifier.identifier;

        if(this.manuallyMarkCompleted)
            this.simulatorLesson.lessonState = SimulatorLessonState.Completed;

        this._simulatorLessonsServiceProxy.createOrEdit(this.simulatorLesson)
            .pipe(finalize(() => { this.saving = false; }))
            .subscribe(() => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
            });
    }

    openSelectPersonModal() {
        this.simulatorLessonPersonLookupTableModal.id = this.simulatorLesson.studentId;
        this.simulatorLessonPersonLookupTableModal.displayName = this.personLastName;
        this.simulatorLessonPersonLookupTableModal.show();
    }
    openSelectSimulatorModal() {
        this.simulatorLessonSimulatorLookupTableModal.id = this.simulatorLesson.simulatorId;
        this.simulatorLessonSimulatorLookupTableModal.displayName = this.simulatorName;
        this.simulatorLessonSimulatorLookupTableModal.show();
    }


    setStudentIdNull() {
        this.simulatorLesson.studentId = null;
        this.personLastName = '';
    }
    setSimulatorIdNull() {
        this.simulatorLesson.simulatorId = null;
        this.simulatorName = '';
    }


    getNewStudentId() {
        this.simulatorLesson.studentId = this.simulatorLessonPersonLookupTableModal.id;
        this.personLastName = this.simulatorLessonPersonLookupTableModal.displayName;
    }
    getNewSimulatorId() {
        this.simulatorLesson.simulatorId = this.simulatorLessonSimulatorLookupTableModal.id;
        this.simulatorName = this.simulatorLessonSimulatorLookupTableModal.displayName;

        this._simulatorLessonsServiceProxy.getAvailableModulesOnSimulator(this.simulatorLesson.simulatorId).subscribe(result => {
            this.simulatorModules = result;
        })
    }


    close(): void {

        this.active = false;
        this.modal.hide();
    }
}
