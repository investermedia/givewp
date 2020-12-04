import axios from 'axios';
import { getAPIRoot, getAPINonce } from '../../../utils';
import { store } from '../../../store';
import { setProfile } from '../../../store/actions';

export const updateProfileWithAPI = async( {
	titlePrefix,
	firstName,
	lastName,
	primaryEmail,
	additionalEmails,
	primaryAddress,
	additionalAddresses,
	avatarFile,
	id,
} ) => {
	/**
	 * If a new avatar file is defined, upload it and use the returned
	 * media ID to be stored as donor meta
	 */
	const { profile } = store.getState();
	let { avatarId } = profile;
	if ( avatarFile ) {
		avatarId = await uploadAvatarWithAPI( avatarFile );
	}

	/**
	 * Pass new profile data to the Profile REST endpoint
	 */
	const { dispatch } = store;
	axios.post( getAPIRoot() + 'give-api/v2/donor-profile/profile', {
		data: JSON.stringify( {
			titlePrefix,
			firstName,
			lastName,
			primaryEmail,
			additionalEmails,
			primaryAddress,
			additionalAddresses,
			avatarId,
		} ),
		id,
	}, {
		headers: {
			'X-WP-Nonce': getAPINonce(),
		},
	} )
		.then( ( response ) => response.data )
		.then( ( responseData ) => {
			/**
			 * Once updated, update the store's representation of
			 * the donor's profile data
			 */
			dispatch( setProfile( responseData.profile ) );
		} );
};

export const uploadAvatarWithAPI = ( file ) => {
	// Prepare a FormData object with the file to be past to the 'media' REST endpoint
	const formData = new window.FormData();
	formData.append( 'file', file );

	// Upload the new file, and return the resolved Promise with new media ID
	return axios.post( getAPIRoot() + 'wp/v2/media', formData, {
		headers: {
			'X-WP-Nonce': getAPINonce(),
		},
	} )
		.then( ( response ) => response.data )
		.then( ( responseData ) => responseData.id );
};
