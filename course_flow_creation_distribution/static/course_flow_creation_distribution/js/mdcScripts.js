import { MDCSnackbar } from "@material/snackbar";

export function createSnackbar() {
  const snackbar = new MDCSnackbar(document.querySelector(".mdc-snackbar"));
  return snackbar;
}
