import * as React from "react";
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import DoneIcon from "@mui/icons-material/Done";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import * as dayjs from 'dayjs'
//import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ar'
export default function NotificationItem({notification,handleCloseMenu}) {
  
  //dayjs.extend(duration)
  dayjs.extend(relativeTime)
  dayjs.locale("ar");

  const timeAgo = dayjs(notification.created_at).fromNow(); // a minute

  return (
    //dayjs().format()
    <>
    
      <MenuItem onClick={handleCloseMenu}>
        <ListItemIcon>
          <DoneIcon fontSize="small" />
        </ListItemIcon>
        <Box>
          <Typography variant="subtitle1" component="div">
            {notification.title}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {notification.body}
          </Typography>
          <Typography variant="caption" sx={{ color:"gray" }}>
            <AccessTimeIcon fontSize="small" /> {timeAgo}
          </Typography>
        </Box>
      </MenuItem>
      <Divider />
    </>
  );
}
