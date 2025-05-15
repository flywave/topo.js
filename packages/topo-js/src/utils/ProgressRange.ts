import type { Message_ProgressRange } from "replicad-opencascadejs";
import { WrappingObj } from "../register";
import { getTopo } from "../topolib";

export class ProgressRange extends WrappingObj<Message_ProgressRange> {
  constructor() {
    const oc = getTopo();
    super(new oc.Message_ProgressRange_1());
  }
}
