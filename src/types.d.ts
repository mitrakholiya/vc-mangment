import "react";

declare global {
  namespace JSX {
    interface IntrinsicElements extends React.JSX.IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
