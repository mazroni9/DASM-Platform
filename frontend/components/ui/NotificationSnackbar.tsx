import React, { useState, useEffect } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import AlertTitle from '@mui/material/AlertTitle';
import CircleNotificationsIcon from '@mui/icons-material/CircleNotifications';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
export default function NotificationSnackbar({
  title,
  body,
  ViewNotification,
  onClose,
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(ViewNotification);
  }, [ViewNotification]);

  const handleClose = () => {
    setOpen(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        sx={{ width: "40%" }}
      >
      
        {/* <Alert icon={<NotificationsIcon />} variant="outlined" severity="success">
          <AlertTitle>{title}</AlertTitle>
          {body}
        </Alert> */}

        <Card sx={{ width: "80%",backgroundColor: "white",borderRadius: "10px",boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.32)" }}> 
          
            <CardContent sx={{ height: '100%' }}>
              <Typography variant="h5" component="div">
              <NotificationsIcon sx={{ color: "#FFD700" }} /> {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {body}
              </Typography>
            </CardContent>
        </Card>

      </Snackbar>
    </div>
  );
}
