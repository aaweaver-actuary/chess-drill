import Chessground from '@react-chess/chessground';

// these styles must be imported somewhere
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';
import { Config } from 'chessground/config';
import { ChessGroundBoardProps } from './ChessGroundBoardProps';

export const ChessGroundBoardDefaultConfig: Config = {};

export default function ChessGroundBoard({
  width = 900,
  height = 900,
  cg_config = ChessGroundBoardDefaultConfig,
  contained = false,
}: ChessGroundBoardProps): React.JSX.Element {
  return (
    <div
      style={{
        width: contained ? '100%' : width,
        height: contained ? '100%' : height,
        position: 'relative',
      }}
    >
      <Chessground
        // width={contained ? undefined : width}
        // height={contained ? undefined : height}
        // config={cg_config}
      />
    </div>
  );
}
