import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { View, EventSettingsModel, DayService, WeekService, WorkWeekService, MonthService, AgendaService, MonthAgendaService, TimelineViewsService, TimelineMonthService, ScheduleComponent, PopupOpenEventArgs, CellClickEventArgs, EventClickArgs, NavigatingEventArgs, ActionEventArgs, EventRenderedArgs } from '@syncfusion/ej2-angular-schedule';
import { AppointmentsServiceProxy } from '@shared/service-proxies/service-proxies';
import * as moment from 'moment';
import { CreateOrEditDrivingLessonModalComponent } from '../lessons/drivingLessons/create-or-edit-drivingLesson-modal.component';
import { CreateEventTypeModalComponent } from './create-event-type-modal.component';
import { CreateOrEditTheoryLessonModalComponent } from '../lessons/theoryLessons/create-or-edit-theoryLesson-modal.component';
import { CreateOrEditEventModalComponent } from './create-or-edit-event-modal.component';
import { InstructorLookupTableModalComponent } from '@app/shared/common/lookup/instructor-lookup-table-modal.component';


@Component({
    providers: [DayService, WeekService, WorkWeekService, MonthService, AgendaService, MonthAgendaService, TimelineViewsService, TimelineMonthService],
    templateUrl: './scheduler.component.html',
    animations: [appModuleAnimation()]
})
export class SchedulerComponent extends AppComponentBase implements OnInit {

    @ViewChild('scheduleObj')
    scheduleObj: ScheduleComponent;

    @ViewChild('createOrEditDrivingLessonModal')
    createOrEditDrivingLessonModal: CreateOrEditDrivingLessonModalComponent;

    @ViewChild('createOrEditTheoryLessonModal')
    createOrEditTheoryLessonModal: CreateOrEditTheoryLessonModalComponent;

    @ViewChild('createOrEditEventModal')
    createOrEditEventModal: CreateOrEditEventModalComponent;

    @ViewChild('createEventTypeModal')
    createEventTypeModal: CreateEventTypeModalComponent;

    @ViewChild('instructorLookupTableModal')
    instructorLookupTableModal: InstructorLookupTableModalComponent;

    currentInstructorFullName: string = '';
    instructorId: number;

    startTime: Date;

    // public data: object[] = [];
    public data: object[] = [{
        Id: 2,
        Subject: 'Meeting',
        StartTime: new Date(2019, 7, 2, 10, 0),
        EndTime: new Date(2019, 7, 2, 12, 30),
        IsAllDay: false,
        AppointmentType: -1
    }];

    public eventSettings: EventSettingsModel = {
        dataSource: this.data
    }

    public currentView: View = 'Day';

    constructor(
        injector: Injector,
        private _appointmentsServiceProxy: AppointmentsServiceProxy
    ) {
        super(injector);
    }

    ngOnInit(): void {
        //this.updateCurrentView();
    }

    onPopupOpen(args: PopupOpenEventArgs): void {
        args.cancel = true;
        //this.createOrEditDrivingLessonModal.show();
        //this.createEventTypeModal.show();
    }

    onCellClick(args: CellClickEventArgs): void {
        console.log(args);
        this.startTime = args.startTime;
        this.createEventTypeModal.show(this);
    }

    onEventClick(args: EventClickArgs): void {
        console.log(args);
        console.log(args.event["Id"]);

        if (args.event["AppointmentType"] == 0)
            this.createOrEditDrivingLessonModal.show(args.event["Id"]);
        else if (args.event["AppointmentType"] == 1)
            this.createOrEditTheoryLessonModal.show(args.event["Id"]);
        else if (args.event["AppointmentType"] == 2)
            this.createOrEditEventModal.show(args.event["Id"]);
    }

    Doubleclick(args: EventClickArgs): void {
        console.log("Yay");
    }

    actionComplete(args: ActionEventArgs) {

        if (args.requestType == "dateNavigate" || args.requestType == "viewNavigate") {
            this.updateCurrentView();
        }
    }

    schedulerCreated(args: Object) {
        this.updateCurrentView();
    }

    navigating(args: NavigatingEventArgs): void {
        // this.scheduleObj.showSpinner();
        // console.log(args);
        // this.scheduleObj.refresh();
        // console.log(this.scheduleObj.getCurrentViewDates());

        // if(args.action == 'date' && args.currentDate != null)
        // {
        //     if(this.scheduleObj.currentView == 'Day')
        //     {
        //         // Get events of this day
        //     }

        //     if(this.scheduleObj.currentView == 'Week')
        //     {
        //         // Get events of this week 
        //     }

        //     if(this.scheduleObj.currentView == 'Month')
        //     {
        //         // Get events of this month
        //     }
        // }

        // if(args.action == 'view' && args.previousView == 'Day' && args.currentView == 'Week')
        // {   
        //     // changed from day to week
        // }

        // else if(args.action == 'view' && args.previousView == 'Week' && args.currentView == 'Month')
        // {   
        //     // changed from day to week
        // }

        // else if(args.action == 'view')
        // {
        //     // changed from month to week or month to day or week to day
        // }

        // this.updateView(args.currentDate, args.currentDate);
    }

    openDrivingLessonModal(): void {
        this.createEventTypeModal.close();
        this.createOrEditDrivingLessonModal.startTime = this.startTime;
        this.createOrEditDrivingLessonModal.show();
    }

    openTheoryLessonModal(): void {
        this.createEventTypeModal.close();
        //this.createOrEditTheoryLessonModal.startTime = this.startTime;
        this.createOrEditTheoryLessonModal.show(null, null, this.startTime);
    }

    openEventModal(): void {
        this.createEventTypeModal.close();
        this.createOrEditEventModal.startTime = this.startTime;
        this.createOrEditEventModal.show();
    }

    updateView(from: Date, to: Date): void {

        this.data.length = 0;

        this.scheduleObj.showSpinner();

        if(this.instructorId == null)
        {
            this._appointmentsServiceProxy.getAll(
                moment(from).startOf('day'),
                moment(to).startOf('day')).subscribe(result => {

                    //console.log(result);

                    for (var item of result.items) {
                        this.data.push(
                            {
                                Id: item.id,
                                Subject: item.subject,
                                StartTime: item.startTime.toDate(),
                                EndTime: item.endTime.toDate(),
                                AppointmentType: item.appointmentType.toString()
                            });
                    }

                    //console.log( this.data);

                    this.scheduleObj.refresh();

                    this.scheduleObj.hideSpinner();

                });
        }
        else
        {
            this._appointmentsServiceProxy.getAllAppointmentsOfInstructor(
                this.instructorId,
                moment(from).startOf('day'),
                moment(to).startOf('day')).subscribe(result => {

                    //console.log(result);

                    for (var item of result) {
                        this.data.push(
                            {
                                Id: item.id,
                                Subject: item.subject,
                                StartTime: item.startTime.toDate(),
                                EndTime: item.endTime.toDate(),
                                AppointmentType: item.appointmentType.toString()
                            });
                    }

                    //console.log( this.data);

                    this.scheduleObj.refresh();

                    this.scheduleObj.hideSpinner();

                });
        }
    }

    updateCurrentView(): void {
        //console.log(this.scheduleObj.getCurrentViewDates());
        var dates = this.scheduleObj.getCurrentViewDates();

        if (dates == null || dates.length == 0)
            return;

        var fromDate: Date = new Date(dates[0].toString());
        var toDate = new Date(dates[dates.length - 1].toString());
        toDate.setDate(toDate.getDate() + 1);

        this.updateView(fromDate, toDate);
    }

    onEventRendered(args: EventRenderedArgs): void {

        console.log(args.data.AppointmentType);
        switch (args.data.AppointmentType) {
            case '0':
                console.log("go");
                (args.element as HTMLElement).style.backgroundColor = '#F57F17';
                break;
            case '1':
                (args.element as HTMLElement).style.backgroundColor = '#7fa900';
                break;
            case '2':
                (args.element as HTMLElement).style.backgroundColor = '#8e24aa';
                break;
        }
    }

    setInstructorNull() {
        this.instructorId = null;
        this.currentInstructorFullName = '';

        this.updateCurrentView();
    }


    getNewInstructorId() {
        this.instructorId = this.instructorLookupTableModal.id;
        this.currentInstructorFullName = this.instructorLookupTableModal.firstName + ' ' + this.instructorLookupTableModal.lastName;

        this.updateCurrentView();
    }

    openSelectInstructorModal() {
        //this.vehicleLicenseClassLookupTableModal.id = this.vehicle.licenseClassId;
        //this.vehicleLicenseClassLookupTableModal.displayName = this.licenseClassClass;
        this.instructorLookupTableModal.show();
    }

}
