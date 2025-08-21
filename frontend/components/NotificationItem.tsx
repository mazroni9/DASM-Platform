import * as React from "react";
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import DoneIcon from "@mui/icons-material/Done";
export default function NotificationItem({title,body,handleCloseMenu}) {

  return (
    <>
      <MenuItem onClick={handleCloseMenu}>
        <ListItemIcon>
          <DoneIcon fontSize="small" />
        </ListItemIcon>
        <Box>
          <Typography variant="subtitle1" component="div">
            {title}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {body}
          </Typography>
        </Box>
      </MenuItem>
      <Divider />
    </>
  );
}
