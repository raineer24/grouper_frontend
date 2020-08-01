import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { selectCurrentUser, AuthModuleState } from '@authorization/store';
import { IUser } from '@core/interfaces';
import { equalityValidator } from '@core/validators/equality.validator';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { selectProfileData, selectProfileLoading, ProfileModuleState } from '../../store';
import * as profileActions from '../../store/profile.actions';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnDestroy {
  profile: IUser;
  profileLoading$: Observable<boolean>;
  currentUser: IUser;
  sub$: Subscription;
  editing: boolean;
  editForm: FormGroup;
  editPasswordForm: FormGroup;

  constructor(private store: Store<AuthModuleState | ProfileModuleState>, private route: ActivatedRoute, private cdRef: ChangeDetectorRef) {
    this._initValues();
    this._initSubscriptions();
    this._initPasswordForm();
  }

  get isCurrentUser(): boolean {
    return !!this.currentUser && !!this.profile && this.currentUser.id === this.profile.id;
  }

  private _initValues(): void {
    this.sub$ = new Subscription();
    this.editing = false;
  }

  private _initSubscriptions(): void {
    const currentUser$ = this.store
      .select(selectCurrentUser)
      .pipe(
        filter((user) => {
          return !!user;
        }),
      )
      .subscribe((user) => {
        this.currentUser = user;
        this.cdRef.markForCheck();
      });
    this.sub$.add(currentUser$);

    const profile$ = this.store
      .select(selectProfileData)
      .pipe(filter((profile) => profile !== null))
      .subscribe((profile) => {
        this.profile = profile;
        this._initForm();
      });
    this.sub$.add(profile$);

    const route$ = this.route.params.subscribe((params) => {
      if (params.id.length > 0) {
        this.store.dispatch(profileActions.loadProfileData({ userId: params.id }));
      }
    });
    this.sub$.add(route$);

    this.profileLoading$ = this.store.select(selectProfileLoading);
  }

  private _initForm(): void {
    this.editForm = new FormGroup({
      firstName: new FormControl(this.profile.first_name, [Validators.required]),
      lastName: new FormControl(this.profile.last_name, [Validators.required]),
      email: new FormControl(this.profile.email, [Validators.required, Validators.email]),
    });
  }

  private _initPasswordForm(): void {
    this.editPasswordForm = new FormGroup({
      password: new FormControl(null, [Validators.required, Validators.minLength(8)]),
      repeatPassword: new FormControl(null, [Validators.required, equalityValidator('password')]),
    });
  }

  editToggle(): void {
    this.editing = !this.editing;
  }

  submitUpdate(): void {
    console.log(this.editForm.value);
  }

  ngOnDestroy(): void {
    this.sub$.unsubscribe();
  }
}