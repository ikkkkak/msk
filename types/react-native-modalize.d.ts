declare module "react-native-modalize" {
  import { Component } from "react";
  import { ViewStyle } from "react-native";

  export interface ModalizeProps {
    children?: any;
    modalHeight?: number;
    handleStyle?: ViewStyle;
    onClosed?: () => void;
    onOpened?: () => void;
    [key: string]: any;
  }

  export class Modalize extends Component<ModalizeProps> {
    open(): void;
    close(): void;
  }

  export default Modalize;
}
