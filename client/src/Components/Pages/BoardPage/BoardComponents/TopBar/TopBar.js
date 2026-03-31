import React, { useEffect, useState } from 'react';
import * as style from './styled';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import * as common from '../../CommonStyled';
import { useDispatch, useSelector } from 'react-redux';
import { boardTitleUpdate } from '../../../../../Services/boardsService';
import RightDrawer from '../../../../Drawers/RightDrawer/RightDrawer';
import BasePopover from '../../../../Modals/EditCardModal/ReUsableComponents/BasePopover';
import InviteMembers from '../../../../Modals/EditCardModal/Popovers/InviteMembers/InviteMembers';
import { isConnected } from '../../../../../Services/socketService';


const TopBar = () => {
	const board = useSelector((state) => state.board);
	const [currentTitle, setCurrentTitle] = useState(board.title);
	const [showDrawer,setShowDrawer] = useState(false);
	const [invitePopover, setInvitePopover] = React.useState(null);
	const [socketConnected, setSocketConnected] = useState(false);
	const dispatch = useDispatch();

	// Poll socket connection status every 2 seconds for indicator
	useEffect(() => {
		const check = () => setSocketConnected(isConnected());
		check();
		const interval = setInterval(check, 2000);
		return () => clearInterval(interval);
	}, []);

	useEffect(()=>{
		if(!board.loading)
			setCurrentTitle(board.title);
	},[board.loading, board.title]);

	const handleTitleChange = () => {
		boardTitleUpdate(currentTitle,board.id,dispatch);
	};

	return (
		<style.TopBar>
			<style.LeftWrapper>
				<style.InviteButton onClick={(event) => setInvitePopover(event.currentTarget)}>
					<PersonAddAltIcon />
					<style.TextSpan>Add Member</style.TextSpan>
				</style.InviteButton>
				{invitePopover && (
				<BasePopover
					anchorElement={invitePopover}
					closeCallback={() => {
						setInvitePopover(null);
					}}
					title='Invite Members'
					contents={<InviteMembers closeCallback={() => {
						setInvitePopover(null);
					}}/>}
				/>
			)}

				<style.BoardNameInput
					placeholder='Board Name'
					value={currentTitle}
					onChange={(e) => setCurrentTitle(e.target.value)}
					onBlur={handleTitleChange}
				/>
			</style.LeftWrapper>

			<style.RightWrapper>
				{/* Real-time connection indicator */}
				<style.LiveIndicator connected={socketConnected ? 1 : 0} title={socketConnected ? 'Real-time connected' : 'Real-time disconnected'}>
					<div className='dot' />
					<span className='label'>{socketConnected ? 'Live' : 'Offline'}</span>
				</style.LiveIndicator>

				<common.Button onClick={()=>{setShowDrawer(true)}}>
					<MoreHorizIcon />
					<style.TextSpan>Show menu</style.TextSpan>
				</common.Button>
			</style.RightWrapper>
			<RightDrawer show={showDrawer} closeCallback={()=>{setShowDrawer(false)}} />
		</style.TopBar>
	);
};

export default TopBar;
