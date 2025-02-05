import React from 'react';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Link from '@material-ui/core/Link';
import Divider from '@material-ui/core/Divider';

export interface InstructionsProps {}

const Instructions: React.FC<InstructionsProps> = () => (
  <Paper className="instructions-container">
    <Typography variant="h5" component="h1" className="pad-1">
      Instructions
    </Typography>
    <Divider />
    <Typography className="pad-1" component="div">
      You can change all of the function buttons on the QuickStrip (and the MORE Panel) as you prefer.
      <ol>
        <li>Look through the list of features in the "All Choices List" - and check all that you might be interested in.
          <ul>
            <li>When you check items in the "All Choices List" they will show up within "My Choices" so they are handy for exploring and putting into your QuickStrip or More Panel.</li>
          </ul>
        </li>
        <li>You can then drag buttons back and forth between My Choices and the QuickStrip (or the MORE Panel) till you get what you want there.
          <ul>
            <li>The strip will automatically make room and resize for any number of buttons you want to add.</li>
          </ul>
        </li>
        <li>You can also resize the QuickStrip yourself using the + and - buttons.</li>
        <li>When you are done - click SAVE.</li>
      </ol>
      NOTE: Everything can also be done by those who cannot "drag and drop" by using the left- and right-click buttons on the mouse/touch screen. Everything can also be done using the keyboard only, by using arrow key, tab, spacebar and return keys.
      &nbsp;
      <Link
        href="https://morphic.world/"
        target="_blank"
        rel="noopener"
      >
        Learn more...
      </Link>
    </Typography>
  </Paper>
);

export default Instructions;
