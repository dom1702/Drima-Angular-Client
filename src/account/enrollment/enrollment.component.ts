import { Component, Injector, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    EditionSelectDto,
    EditionWithFeaturesDto,
    EditionsSelectOutput,
    FlatFeatureSelectDto,
    SubscriptionServiceProxy,
    TenantRegistrationServiceProxy,
    EditionPaymentType,
    SubscriptionStartType
} from '@shared/service-proxies/service-proxies';
import * as _ from 'lodash';

@Component({
    selector: 'enrollment',
    templateUrl: './enrollment.component.html',
    styleUrls: ['./enrollment.component.less', './enrollment.min.css'],
    encapsulation: ViewEncapsulation.None,
    animations: [accountModuleAnimation()]
})
export class EnrollmentComponent extends AppComponentBase implements OnInit {

    licenseClasses : any[] = 
    [
        {
            className: "Class B",
            subtitle: "Passenger car",
            description: "Choose this class if you want to drive a normal car",
            imageUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-b.jpg?__blob=normal"
        },
        {
            className: "Class A",
            subtitle: "Motorcycle",
            imageUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-a.jpg?__blob=normal"
        },
        {
            className: "Class BE",
            subtitle: "Passenger car with trailer",
            imageUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-be.jpg?__blob=normal"
        },
        {
            className: "Class M",
            subtitle: "Motorcycle 50 ccm",
            imageUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-am.jpg?__blob=normal"
        },
        {
            className: "Class AM125",
            subtitle: "Motorcycle 125 ccm",
            imageUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-a2.jpg?__blob=normal"
        },
        {
            className: "Moped",
            subtitle: "Motorcycle 50 ccm, 25 km/h",
            imageUrl: "https://www.bmvi.de/SharedDocs/DE/Bilder/VerkehrUndMobilitaet/Strasse/fahrerlaubnisklasse-am.jpg?__blob=normal"
        }
    ]

    editionsSelectOutput: EditionsSelectOutput = new EditionsSelectOutput();
    isUserLoggedIn = false;
    isSetted = false;
    editionPaymentType: typeof EditionPaymentType = EditionPaymentType;
    subscriptionStartType: typeof SubscriptionStartType = SubscriptionStartType;
    /*you can change your edition icons order within editionIcons variable */
    editionIcons: string[] = ['flaticon-open-box', 'flaticon-rocket', 'flaticon-gift', 'flaticon-confetti', 'flaticon-cogwheel-2', 'flaticon-app', 'flaticon-coins', 'flaticon-piggy-bank', 'flaticon-bag', 'flaticon-lifebuoy', 'flaticon-technology-1', 'flaticon-cogwheel-1', 'flaticon-infinity', 'flaticon-interface-5', 'flaticon-squares-3', 'flaticon-interface-6', 'flaticon-mark', 'flaticon-business', 'flaticon-interface-7', 'flaticon-list-2', 'flaticon-bell', 'flaticon-technology', 'flaticon-squares-2', 'flaticon-notes', 'flaticon-profile', 'flaticon-layers', 'flaticon-interface-4', 'flaticon-signs', 'flaticon-menu-1', 'flaticon-symbol'];

    constructor(
        injector: Injector,
        private _tenantRegistrationService: TenantRegistrationServiceProxy,
        private _subscriptionService: SubscriptionServiceProxy,
        private _router: Router
    ) {
        super(injector);
    }

    ngOnInit() {
        this.isUserLoggedIn = abp.session.userId > 0;

        this._tenantRegistrationService.getEditionsForSelect()
            .subscribe((result) => {
                this.editionsSelectOutput = result;

                if (!this.editionsSelectOutput.editionsWithFeatures || this.editionsSelectOutput.editionsWithFeatures.length <= 0) {
                    this._router.navigate(['/account/register-tenant']);
                }
            });
    }

    isFree(edition: EditionSelectDto): boolean {
        return !edition.monthlyPrice && !edition.annualPrice;
    }

    isTrueFalseFeature(feature: FlatFeatureSelectDto): boolean {
        return feature.inputType.name === 'CHECKBOX';
    }

    featureEnabledForEdition(feature: FlatFeatureSelectDto, edition: EditionWithFeaturesDto): boolean {
        const featureValues = _.filter(edition.featureValues, { name: feature.name });
        if (!featureValues || featureValues.length <= 0) {
            return false;
        }

        const featureValue = featureValues[0];
        return featureValue.value.toLowerCase() === 'true';
    }

    getFeatureValueForEdition(feature: FlatFeatureSelectDto, edition: EditionWithFeaturesDto): string {
        const featureValues = _.filter(edition.featureValues, { name: feature.name });
        if (!featureValues || featureValues.length <= 0) {
            return '';
        }

        const featureValue = featureValues[0];
        return featureValue.value;
    }

    canUpgrade(edition: EditionSelectDto): boolean {
        if (this.appSession.tenant.edition.id === edition.id) {
            return false;
        }

        const currentMonthlyPrice = this.appSession.tenant.edition.monthlyPrice
            ? this.appSession.tenant.edition.monthlyPrice
            : 0;

        const targetMonthlyPrice = edition && edition.monthlyPrice ? edition.monthlyPrice : 0;

        return this.isUserLoggedIn &&
            this.appSession.tenant.edition &&
            currentMonthlyPrice <= targetMonthlyPrice;
    }

    upgrade(upgradeEdition: EditionSelectDto, editionPaymentType: EditionPaymentType): void {
        if (editionPaymentType === EditionPaymentType.Upgrade && this.upgradeIsFree(upgradeEdition)) {
            this._subscriptionService.upgradeTenantToEquivalentEdition(upgradeEdition.id)
                .subscribe(() => {
                    this._router.navigate(['app/admin/subscription-management']);
                });
        } else {
            this._router.navigate(['/account/upgrade'], { queryParams: { upgradeEditionId: upgradeEdition.id, editionPaymentType: editionPaymentType } });
        }
    }

    upgradeIsFree(upgradeEdition: EditionSelectDto): boolean {
        if (!this.appSession.tenant || !this.appSession.tenant.edition) {
            return false;
        }

        const bothEditionsAreFree = this.appSession.tenant.edition.isFree && upgradeEdition.isFree;

        const bothEditionsHasSamePrice = !upgradeEdition.isFree &&
            upgradeEdition.monthlyPrice === this.appSession.tenant.edition.monthlyPrice &&
            upgradeEdition.annualPrice === this.appSession.tenant.edition.annualPrice;

        return bothEditionsAreFree || bothEditionsHasSamePrice;
    }
}
