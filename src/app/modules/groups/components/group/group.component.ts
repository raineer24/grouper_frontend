import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { selectCurrentUser, AuthModuleState } from '@authorization/store';
import { ROUTES } from '@core/consts';
import { USER_ROLE } from '@core/enums';
import { IGroup, IPost, IUser } from '@core/interfaces';
import { DialogService } from '@core/services';
import { deletePost, editPost, selectDeletingPost, selectEditingPost, CoreModuleState } from '@core/store';
import {
  selectAddingPostVisibility,
  selectDeletingGroup,
  selectDroppingUser,
  selectGroup,
  selectGroupLoading,
  selectGroupPosts,
  selectGroupPostsLoading,
  selectMakingModerator,
  selectMembers,
  selectMembersLoading,
  selectPendingMembers,
  selectPendingMembersLoading,
  selectPendingProcessing,
  selectPostAdding,
  GroupsModuleState,
} from '../../store';
import * as groupsActions from '../../store/groups.actions';

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupComponent implements OnDestroy {
  sub$: Subscription;
  group: IGroup;
  currentUser: IUser;
  groupLoading$: Observable<boolean>;
  postsLoading$: Observable<boolean>;
  postEditing$: Observable<boolean>;
  postDeleting$: Observable<boolean>;
  postAdding$: Observable<boolean>;
  formVisibility$: Observable<boolean>;
  membersLoading$: Observable<boolean>;
  deletingGroup$: Observable<boolean>;
  members: IUser[];
  posts: IPost[];
  postsNext: string;
  membersNext: string;
  pendingMembers: IUser[];
  pendingMembersLoading$: Observable<boolean>;
  pendingMembersNext: string;

  constructor(
    private route: ActivatedRoute,
    private store: Store<GroupsModuleState | AuthModuleState | CoreModuleState>,
    private cdRef: ChangeDetectorRef,
    private router: Router,
    private dialogService: DialogService,
  ) {
    this.sub$ = new Subscription();
    const route$ = this.route.params.subscribe((params) => {
      this.store.dispatch(groupsActions.loadGroup({ id: params.id }));
      this.store.dispatch(groupsActions.loadGroupsPosts({ url: null, id: params.id }));
      this.store.dispatch(groupsActions.loadGroupMembers({ url: null, groupId: params.id }));
      this.store.dispatch(groupsActions.loadPendingMembers({ groupId: params.id, url: null }));
      this.cdRef.markForCheck();
    });
    const group$ = this.store
      .select(selectGroup)
      .pipe(filter((group) => group !== null))
      .subscribe((group) => {
        this.group = group;
        this.cdRef.markForCheck();
      });
    const currentUser$ = this.store.select(selectCurrentUser).subscribe((user) => {
      this.currentUser = user;
      this.cdRef.markForCheck();
    });
    const posts$ = this.store
      .select(selectGroupPosts)
      .pipe(filter((res) => res !== null))
      .subscribe((resPosts) => {
        this.posts = resPosts.posts;
        this.postsNext = resPosts.next;
        this.cdRef.markForCheck();
      });
    const members$ = this.store
      .select(selectMembers)
      .pipe(filter((res) => res !== null))
      .subscribe((res) => {
        this.members = res.users;
        this.membersNext = res.next;
        this.cdRef.markForCheck();
      });
    const pendingMembers$ = this.store
      .select(selectPendingMembers)
      .pipe(filter((res) => res !== null))
      .subscribe((resPending) => {
        this.pendingMembers = resPending.users;
        this.pendingMembersNext = resPending.next;
        this.cdRef.markForCheck();
      });
    this.sub$.add(route$);
    this.sub$.add(group$);
    this.sub$.add(currentUser$);
    this.sub$.add(posts$);
    this.sub$.add(members$);
    this.sub$.add(pendingMembers$);
    this.groupLoading$ = this.store.select(selectGroupLoading);
    this.postsLoading$ = this.store.select(selectGroupPostsLoading);
    this.postEditing$ = this.store.select(selectEditingPost);
    this.postDeleting$ = this.store.select(selectDeletingPost);
    this.postAdding$ = this.store.select(selectPostAdding);
    this.formVisibility$ = this.store.select(selectAddingPostVisibility);
    this.membersLoading$ = this.store.select(selectMembersLoading);
    this.pendingMembersLoading$ = this.store.select(selectPendingMembersLoading);
    this.deletingGroup$ = this.store.select(selectDeletingGroup);
  }

  get ownerOrAdmin() {
    return this.group?.owner.id === this.currentUser?.id || this.currentUser?.role === USER_ROLE.ADMIN;
  }

  routeToPost(event: { id: number }) {
    this.router.navigate([ROUTES.singlePost.path + event.id + '/']);
  }

  @HostListener('window:scroll') scrollEvent() {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      if (this.postsNext !== null) {
        this.store.dispatch(groupsActions.loadGroupsPosts({ url: this.postsNext, id: this.group.id }));
      }
      if (this.membersNext !== null) {
        this.store.dispatch(groupsActions.loadGroupMembers({ groupId: this.group.id, url: this.membersNext }));
      }
      if (this.pendingMembersNext !== null) {
        this.store.dispatch(groupsActions.loadPendingMembers({ groupId: this.group.id, url: this.pendingMembersNext }));
      }
    }
  }

  addPost = ($event: { data: FormData }) => {
    this.store.dispatch(
      groupsActions.addPost({
        groupId: this.group.id,
        post: $event.data,
        refreshAction: groupsActions.loadGroupsPosts({ id: this.group.id, url: null }),
      }),
    );
  };

  updatePost = ($event: { id: number; data: FormData }) =>
    this.store.dispatch(
      editPost({ post: $event.data, id: $event.id, refreshAction: groupsActions.loadGroupsPosts({ url: null, id: this.group.id }) }),
    );

  deletePost = ($event: { id: number }) =>
    this.store.dispatch(deletePost({ id: $event.id, refreshAction: groupsActions.loadGroupsPosts({ url: null, id: this.group.id }) }));

  showForm = () => {
    this.store.dispatch(groupsActions.showAddingPostForm());
  };

  hideForm = () => {
    this.store.dispatch(groupsActions.hideAddingPostForm());
  };

  showModDialog(member: IUser) {
    this.dialogService.showDialog({
      header: 'Moderator',
      caption: 'Czy ustawić tego użytkownika moderatorem?',
      onAcceptCallback: () => {
        this.store.dispatch(
          groupsActions.makeModerator({
            groupId: this.group.id,
            moderatorId: member.id,
          }),
        );
      },
      loadingSelect: this.store.select(selectMakingModerator),
    });
  }

  showDeleteDialog(member: IUser) {
    this.dialogService.showDialog({
      header: 'Usuwanie',
      caption: 'Czy usunąć tego użytkownika',
      onAcceptCallback: () => {
        this.store.dispatch(
          groupsActions.dropMember({
            memberId: member.id,
            groupId: this.group.id,
          }),
        );
      },
      loadingSelect: this.store.select(selectDroppingUser),
    });
  }

  showAcceptDialog(pendingMember: IUser) {
    this.dialogService.showDialog({
      header: 'Akceptacja',
      caption: 'Na pewno chcesz akceptować użytkownika?',
      onAcceptCallback: () => {
        this.store.dispatch(
          groupsActions.acceptPendingMember({
            userId: pendingMember.id,
            groupId: this.group.id,
          }),
        );
      },
      loadingSelect: this.store.select(selectPendingProcessing),
    });
  }

  showRejectDialog(pendingMember: IUser) {
    this.dialogService.showDialog({
      header: 'Akceptacja',
      caption: 'Na pewno chcesz odrzucić użytkownika?',
      onAcceptCallback: () => {
        this.store.dispatch(
          groupsActions.rejectPendingMember({
            userId: pendingMember.id,
            groupId: this.group.id,
          }),
        );
      },
      loadingSelect: this.store.select(selectPendingProcessing),
    });
  }

  deleteGroup() {
    this.dialogService.showDialog({
      header: 'Usuwanie grupy',
      caption: 'Tego nie da się cofnąć!',
      onAcceptCallback: () => {
        this.store.dispatch(groupsActions.deleteGroup({ groupId: this.group.id }));
      },
      loadingSelect: this.deletingGroup$,
    });
  }

  leaveGroup() {}

  ngOnDestroy(): void {
    this.sub$.unsubscribe();
  }
}
