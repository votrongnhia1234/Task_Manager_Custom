import Navbar from '../../Navbar';
import React, { useEffect, useState } from 'react';
import TopBar from './BoardComponents/TopBar/TopBar';
import * as style from './Styled';
import AddList from './BoardComponents/AddList/AddList';
import List from './BoardComponents/List/List';
import { useDispatch, useSelector } from 'react-redux';
import { getBoard } from '../../../Services/boardsService';
import { getLists } from '../../../Services/boardService';
import { updateCardOrder, updateListOrder } from '../../../Services/dragAndDropService';
import LoadingScreen from '../../LoadingScreen';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import {
	connectSocket,
	joinBoard,
	leaveBoard,
	onEvent,
	offEvent,
} from '../../../Services/socketService';
import {
	updateCardDragDrop,
	updateListDragDrop,
	successCreatingList,
	successDeletingList,
	successCreatingCard,
	deleteCard,
	updateListTitle,
	setCardTitle,
	updateDescriptionOfCard,
	updateCoverOfCard,
} from '../../../Redux/Slices/listSlice';

const Board = (props) => {
	/* props.match.params.id */
	const dispatch = useDispatch();
	const { backgroundImageLink, isImage, loading, title } = useSelector((state) => state.board);
	const { allLists, loadingListService } = useSelector((state) => state.list);
	const [searchString, setSearchString] = useState('');
	const boardId = props.match.params.id;

	// ─── Initial Data Fetch ───────────────────────────────────────────────────
	useEffect(() => {
		getBoard(props.match.params.id, dispatch);
		getLists(boardId, dispatch);
	}, [props.match.params.id, dispatch, boardId]);

	useEffect(() => {
		document.title = title + ' | Task Manager';
	}, [title]);

	// ─── Socket.IO Real-time ─────────────────────────────────────────────────
	useEffect(() => {
		// Connect socket & join board room
		connectSocket();
		joinBoard(boardId);

		// Handler: card drag-drop updated by another user
		const handleCardOrderUpdated = (data) => {
			// We need to rebuild the list state from the socket payload.
			// We use a Redux action that accepts the same parameters as the optimistic update.
			dispatch((dispatch, getState) => {
				const { allLists } = getState().list;
				const { sourceId, destinationId, destinationIndex, cardId } = data;

				let tempList = JSON.parse(JSON.stringify(allLists));
				const cardItem = allLists
					.find((l) => l._id === sourceId)
					?.cards.find((c) => c._id === cardId);

				if (!cardItem) return; // card not found locally, skip

				if (sourceId === destinationId) {
					tempList = tempList.map((list) => {
						if (list._id === sourceId) {
							const srcIdx = list.cards.findIndex((c) => c._id === cardId);
							if (srcIdx > -1) {
								list.cards.splice(srcIdx, 1);
								list.cards.splice(destinationIndex, 0, cardItem);
							}
						}
						return list;
					});
				} else {
					tempList = tempList.map((list) => {
						if (list._id === sourceId) {
							list.cards = list.cards.filter((c) => c._id !== cardId);
						}
						return list;
					});
					tempList = tempList.map((list) => {
						if (list._id === destinationId) {
							list.cards.splice(destinationIndex, 0, cardItem);
						}
						return list;
					});
				}
				dispatch(updateCardDragDrop(tempList));
			});
		};

		// Handler: list reorder by another user
		const handleListOrderUpdated = (data) => {
			dispatch((dispatch, getState) => {
				const { allLists } = getState().list;
				const { sourceIndex, destinationIndex, listId } = data;

				let tempList = JSON.parse(JSON.stringify(allLists));
				const list = allLists.find((l) => l._id === listId);
				if (!list) return;

				tempList.splice(sourceIndex, 1);
				tempList.splice(destinationIndex, 0, list);
				dispatch(updateListDragDrop(tempList));
			});
		};

		// Register all socket event handlers
		onEvent('card-order-updated', handleCardOrderUpdated);
		onEvent('list-order-updated', handleListOrderUpdated);
		onEvent('list-created', (data) => dispatch(successCreatingList(data)));
		onEvent('list-deleted', (data) => dispatch(successDeletingList(data.listId)));
		onEvent('card-created', (data) => dispatch(successCreatingCard(data)));
		onEvent('card-deleted', (data) => dispatch(deleteCard({ listId: data.listId, cardId: data.cardId })));
		onEvent('list-title-updated', (data) => dispatch(updateListTitle({ listId: data.listId, title: data.title })));
		onEvent('card-title-updated', (data) =>
			dispatch(setCardTitle({ listId: data.listId, cardId: data.cardId, title: data.title }))
		);
		onEvent('card-description-updated', (data) =>
			dispatch(updateDescriptionOfCard({ listId: data.listId, cardId: data.cardId, description: data.description }))
		);
		onEvent('card-cover-updated', (data) =>
			dispatch(
				updateCoverOfCard({
					listId: data.listId,
					cardId: data.cardId,
					color: data.color,
					isSizeOne: data.isSizeOne,
				})
			)
		);

		// Cleanup: leave the room and remove listeners when component unmounts or boardId changes
		return () => {
			leaveBoard(boardId);
			offEvent('card-order-updated', handleCardOrderUpdated);
			offEvent('list-order-updated', handleListOrderUpdated);
			offEvent('list-created');
			offEvent('list-deleted');
			offEvent('card-created');
			offEvent('card-deleted');
			offEvent('list-title-updated');
			offEvent('card-title-updated');
			offEvent('card-description-updated');
			offEvent('card-cover-updated');
		};
	}, [boardId, dispatch]);

	// ─── Drag & Drop ─────────────────────────────────────────────────────────
	const onDragEnd = async (result) => {
		const { draggableId, source, destination } = result;
		if (!destination) return;
		if (result.type === 'column') {
			if (source.index === destination.index) return;
			await updateListOrder(
				{
					sourceIndex: source.index,
					destinationIndex: destination.index,
					listId: draggableId,
					boardId: boardId,
					allLists: allLists,
				},
				dispatch
			);
			return;
		}
		if (source.droppableId === destination.droppableId && source.index === destination.index) return;
		await updateCardOrder(
			{
				sourceId: source.droppableId,
				destinationId: destination.droppableId,
				sourceIndex: source.index,
				destinationIndex: destination.index,
				cardId: draggableId,
				boardId: boardId,
				allLists: allLists,
			},
			dispatch
		);
	};

	return (
		<>
			<Navbar searchString={searchString} setSearchString={setSearchString} />
			<style.Container
				isImage={isImage}
				bgImage={isImage ? backgroundImageLink.split('?')[0] : backgroundImageLink}
			>
				<TopBar />
				{(loading || loadingListService) && <LoadingScreen />}
				<DragDropContext onDragEnd={onDragEnd}>
					<Droppable droppableId='all-columns' direction='horizontal' type='column'>
						{(provided, snapshot) => {
							return (
								<style.ListContainer {...provided.droppableProps} ref={provided.innerRef}>
									{!loading &&
										allLists.map((list, index) => {
											return (
												<List
													searchString={searchString}
													key={list._id}
													index={index}
													info={list}
													boardId={boardId}
												/>
											);
										})}
									{provided.placeholder}
									<AddList boardId={boardId} />
								</style.ListContainer>
							);
						}}
					</Droppable>
				</DragDropContext>
			</style.Container>
		</>
	);
};

export default Board;
