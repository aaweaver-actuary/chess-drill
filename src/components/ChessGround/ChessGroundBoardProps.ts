import { Config } from "chessground/config";

export interface ChessGroundBoardProps {
  width?: number;
  height?: number;
  cg_config?: Config;
  contained?: boolean;
}