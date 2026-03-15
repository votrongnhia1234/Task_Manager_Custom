import * as React from 'react';
import Backdrop from '@mui/material/Backdrop';
import styled, { keyframes } from 'styled-components';
import Logo from '../Images/logo.svg';

const pulse = keyframes`
  0% { transform: scale(0.9); opacity: 0.7; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.7; }
`;

const Icon = styled.img`
	width: 10vw;
	animation: ${pulse} 1.5s infinite ease-in-out;
`;

export default function LoadingScreen() {
	const [open] = React.useState(true);
	/*  const handleClose = () => {
    setOpen(false);
  }; */
	return (
		<div>
			<Backdrop
				sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
				open={open}
				//onClick={handleClose}
			>
				<Icon src={Logo} alt="Loading..." />
			</Backdrop>
		</div>
	);
}
