/**
 * صفحة عرض المنشور (PostDetail)
 * ──────────────────────────────
 * تعرض تفاصيل منشور واحد:
 *  • سلايدر صور (Swiper)
 *  • معلومات المؤلف والوقت
 *  • أزرار الإعجاب والتعليقات
 *  • تبديل بين محتوى المنشور وقسم التعليقات عند الضغط على أيقونة التعليقات
 */
import {
	IonAvatar,
	IonButton,
	IonChip,
	IonCol,
	IonContent,
	IonGrid,
	IonIcon,
	IonImg,
	IonPage,
	IonRow,
	IonSkeletonText,
	IonText,
	useIonToast,
} from '@ionic/react';
import {
	chatbubbleOutline,
	chatbubble,
	locationOutline,
} from 'ionicons/icons';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import moment from 'moment';
import { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import type { RawDraftContentState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import api from '../config/axios';
import { GET_POST_BY_ID, DELETE_COMMENT } from '../config/urls';
import { AuthContext } from '../context/AuthContext';
import type { PostDetail, PostComment, PostSteps } from '../types/post.types';
import Header from '../components/Header/Header';
import Like from '../components/Like/Like';
import CommentList from '../components/Comment/CommentList';
import CommentForm from '../components/Comment/CommentForm';
import { emitPostsChanged } from '../utils/postsEvents';
import './PostDetail.css';

type RouteParams = { id: string };

/**
 * فحص ما إذا كان steps عبارة عن كائن Draft.js RawDraftContentState
 * يتحقق من وجود خاصية 'blocks' كمصفوفة
 */
const isDraftContentState = (steps: PostSteps): steps is RawDraftContentState => {
	return (
		typeof steps === 'object' &&
		!Array.isArray(steps) &&
		steps !== null &&
		'blocks' in steps &&
		Array.isArray((steps as RawDraftContentState).blocks)
	);
};

const PostDetailPage: React.FC = () => {
	const { id } = useParams<RouteParams>();
	const { user, getProfileImageUrl } = useContext(AuthContext);
	const [presentToast] = useIonToast();

	// ─── الحالة ───
	const [post, setPost] = useState<PostDetail | null>(null);
	const [comments, setComments] = useState<PostComment[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showComments, setShowComments] = useState(false);
	const [commentsLoading, setCommentsLoading] = useState(false);

	// ─── جلب بيانات المنشور ───
	const fetchPost = useCallback(async () => {
		try {
			setIsLoading(true);
			const { data } = await api.get(GET_POST_BY_ID(id));
			setPost(data.post);
			setComments(data.post.Comments ?? []);
		} catch {
			presentToast({
				message: 'فشل تحميل المنشور',
				duration: 3000,
				color: 'danger',
				position: 'bottom',
			});
		} finally {
			setIsLoading(false);
		}
	}, [id, presentToast]);

	useEffect(() => {
		fetchPost();
	}, [fetchPost]);

	// ─── تحويل خطوات التحضير إلى HTML أو مصفوفة نصوص ───
	const stepsContent = useMemo(() => {
		if (!post?.steps) return null;

		// كائن Draft.js → تحويل إلى HTML
		if (isDraftContentState(post.steps)) {
			try {
				return { type: 'html' as const, html: draftToHtml(post.steps) };
			} catch {
				return null;
			}
		}

		// مصفوفة نصوص (منشورات قديمة)
		if (Array.isArray(post.steps) && post.steps.length > 0) {
			return { type: 'list' as const, items: post.steps };
		}

		return null;
	}, [post?.steps]);

	// ─── تبديل عرض التعليقات ───
	const toggleComments = useCallback(() => {
		if (!showComments) {
			// عند فتح التعليقات لأول مرة: عرض محمّل قصير
			setCommentsLoading(true);
			setShowComments(true);
			// محاكاة تحميل قصير لتجربة مستخدم أفضل
			setTimeout(() => setCommentsLoading(false), 400);
		} else {
			setShowComments(false);
		}
	}, [showComments]);

	// ─── إضافة تعليق جديد ───
	const handleCommentAdded = useCallback((comment: PostComment) => {
		setComments((prev) => [...prev, comment]);
		emitPostsChanged();
	}, []);

	// ─── حذف تعليق ───
	const handleDeleteComment = useCallback(async (commentId: number) => {
		try {
			await api.delete(DELETE_COMMENT(commentId));
			setComments((prev) => prev.filter((c) => c.id !== commentId));
			emitPostsChanged();
			presentToast({
				message: 'تم حذف التعليق',
				duration: 3000,
				color: 'success',
				position: 'bottom',
			});
		} catch {
			presentToast({
				message: 'فشل حذف التعليق',
				duration: 3000,
				color: 'danger',
				position: 'bottom',
			});
		}
	}, [presentToast]);

	// ─── صور المنشور أو صورة افتراضية ───
	const postImages = post?.images?.length
		? post.images.map((img) => getProfileImageUrl(img.imageUrl))
		: ['https://ionicframework.com/docs/img/demos/card-media.png'];

	return (
		<IonPage>
			<Header title="عرض منشور" />
			<IonContent>
				{/* ═══ حالة التحميل ═══ */}
				{isLoading && (
					<div className="get-post-skeleton">
						<IonSkeletonText animated className="get-post-skeleton-image" />
						<div className="ion-padding">
							<IonSkeletonText animated style={{ width: '60%', height: '20px' }} />
							<IonSkeletonText animated style={{ width: '40%', height: '14px', marginTop: '8px' }} />
							<IonSkeletonText animated style={{ width: '100%', height: '12px', marginTop: '16px' }} />
							<IonSkeletonText animated style={{ width: '90%', height: '12px', marginTop: '6px' }} />
							<IonSkeletonText animated style={{ width: '80%', height: '12px', marginTop: '6px' }} />
						</div>
					</div>
				)}

				{/* ═══ محتوى المنشور ═══ */}
				{!isLoading && post && (
					<IonGrid className="get-post-container">
						<IonRow className="ion-justify-content-center">
							<IonCol size="12" sizeLg="10" sizeXl="8">
								{/* ─── سلايدر الصور ─── */}
								<Swiper
									className="get-post-swiper"
									modules={[Pagination, Navigation]}
									pagination={{ clickable: true }}
									navigation
									loop={postImages.length > 1}
								>
									{postImages.map((src, index) => (
										<SwiperSlide key={index}>
											<IonImg src={src} alt={`${post.title} - ${index + 1}`} />
										</SwiperSlide>
									))}
								</Swiper>

								<div className="ion-padding get-post-body">
									<IonGrid className="ion-no-padding">
										{/* ─── معلومات المؤلف ─── */}
										<IonRow className="ion-align-items-center get-post-author-row">
											<IonCol size="auto" className="ion-no-padding">
												<div className="get-post-author">
													<IonAvatar className="get-post-avatar">
														<IonImg
															src={getProfileImageUrl(post.User?.ImageUrl)}
															alt={post.User?.name}
														/>
													</IonAvatar>
													<div className="get-post-author-info">
														<IonText className="get-post-author-name">
															{post.User?.name}
														</IonText>
														<IonText color="medium" className="get-post-time">
															{moment(post.createdAt).fromNow()}
														</IonText>
													</div>
												</div>
											</IonCol>
										</IonRow>

										{/* ─── أزرار التفاعل ─── */}
										<IonRow className="get-post-actions">
											<IonCol size="auto" className="ion-no-padding">
												<Like
													postId={post.id}
													initialLiked={post.isLiked}
													initialCount={post.likesCount}
												/>
											</IonCol>
											<IonCol size="auto" className="ion-no-padding">
												<IonButton
													fill="clear"
													size="small"
													className={`comment-toggle-btn ${showComments ? 'active' : ''}`}
													onClick={toggleComments}
												>
													<IonIcon
														icon={showComments ? chatbubble : chatbubbleOutline}
														color={showComments ? 'primary' : 'medium'}
														slot="start"
													/>
													<IonText color={showComments ? 'primary' : 'medium'}>
														{comments.length}
													</IonText>
												</IonButton>
											</IonCol>
										</IonRow>

										{/* ─── المحتوى أو التعليقات (حسب التبديل) ─── */}
										{!showComments ? (
											<div className="get-post-content-section">
												{/* العنوان */}
												<IonText color="dark">
													<h2 className="get-post-title">{post.title}</h2>
												</IonText>

												{/* الموقع */}
												{(post.country || post.region) && (
													<IonChip className="get-post-location" color="medium" outline>
														<IonIcon icon={locationOutline} />
														<span>
															{[post.country, post.region].filter(Boolean).join(' - ')}
														</span>
													</IonChip>
												)}

												{/* المكونات */}
												<div className="get-post-section">
													<IonText color="primary">
														<h3 className="get-post-section-title">المكوّنات</h3>
													</IonText>
													<IonText>
														<p className="get-post-text">{post.content}</p>
													</IonText>
												</div>

												{/* خطوات التحضير */}
												{stepsContent && (
													<div className="get-post-section">
														<IonText color="primary">
															<h3 className="get-post-section-title">خطوات التحضير</h3>
														</IonText>
														{stepsContent.type === 'html' ? (
															<div
																className="get-post-steps-html"
																dangerouslySetInnerHTML={{ __html: stepsContent.html }}
															/>
														) : (
															<ol className="get-post-steps">
																{stepsContent.items.map((step, idx) => (
																	<li key={idx}>
																		<IonText>{step}</IonText>
																	</li>
																))}
															</ol>
														)}
													</div>
												)}
											</div>
										) : (
											<div className="get-post-comments-section">
												<CommentList
													comments={comments}
													currentUserId={user?.id ?? null}
													onDelete={handleDeleteComment}
													isLoading={commentsLoading}
												/>
												<CommentForm
													postId={post.id}
													onAdded={handleCommentAdded}
												/>
											</div>
										)}
									</IonGrid>
								</div>
							</IonCol>
						</IonRow>
					</IonGrid>
				)}

				{/* ═══ المنشور غير موجود ═══ */}
				{!isLoading && !post && (
					<div className="get-post-not-found ion-padding ion-text-center">
						<IonText color="medium">
							<h3>المنشور غير موجود</h3>
							<p>ربما تم حذفه أو الرابط غير صحيح.</p>
						</IonText>
						<IonButton routerLink="/tabs/home" color="primary">
							العودة للرئيسية
						</IonButton>
					</div>
				)}
			</IonContent>
		</IonPage>
	);
};

export default PostDetailPage;
