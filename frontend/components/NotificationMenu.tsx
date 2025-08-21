import * as React from "react";
import api from "@/lib/axios";
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Badge from "@mui/material/Badge";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationItem from "./NotificationItem";
import { useState, useEffect } from "react";
import { useNotification } from "context/NotificationContext";
import Link from 'next/link'

export default function NotificationMenu() {
  const [anchorEl, setAnchorEl] = useState(null);

  function handleNotificationClick(notification) {
    const action = notification.action;
    console.log("action", action);
    if (!action || !action.route_name) {
      return '#';
    }

    let finalUrl = action.route_name;
    for (const key in action.route_params) {
      finalUrl = finalUrl.replace(`[${key}]`, action.route_params[key]);
    }
    return finalUrl;
    //router.push(finalUrl);
  }
  const notificationsData = useNotification();
  console.log("notificationsData", notificationsData);

  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", textAlign: "center" }}>
        <Tooltip title="الاشعارات">
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{ ml: 2 }}
            aria-controls={open ? "notification-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
          >
            <Badge badgeContent={notificationsData.unreadCount} color="primary">
              <NotificationsIcon color="action" />
            </Badge>
          </IconButton>
        </Tooltip>
      </Box>
      <Menu
        anchorEl={anchorEl}
        id="notification-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        sx={{
          overflow: "scroll",
          maxHeight: "500px",
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {notificationsData.notifications.map((notification) => {
          return (
            <Link href={handleNotificationClick(notification)}>
            <NotificationItem
              key={notification.id}
              title={notification.title}
              body={notification.body}
              handleCloseMenu={handleClose}
            />
            </Link>
          );
        })}
      </Menu>
    </>
  );
}
