export type WorkspaceNavState = {
  pending: boolean;
  disabled: boolean;
};

export const WS_EVENTS = {
  submit: "lp-ws:submit",
  toggleBrief: "lp-ws:toggle-brief",
  toggleResults: "lp-ws:toggle-results",
  state: "lp-ws:state",
} as const;

export function dispatchWorkspaceState(state: WorkspaceNavState) {
  window.dispatchEvent(
    new CustomEvent(WS_EVENTS.state, { detail: state }),
  );
}

export function requestWorkspaceSubmit() {
  window.dispatchEvent(new CustomEvent(WS_EVENTS.submit));
}

export function requestToggleBrief() {
  window.dispatchEvent(new CustomEvent(WS_EVENTS.toggleBrief));
}

export function requestToggleResults() {
  window.dispatchEvent(new CustomEvent(WS_EVENTS.toggleResults));
}
