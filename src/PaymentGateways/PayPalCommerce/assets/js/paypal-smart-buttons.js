/* globals jQuery, paypal, Give */
import DonationForm from './DonationForm';

/**
 * PayPal Smart Buttons.
 */
class SmartButtons {
	/**
	 * Constructor.
	 *
	 * @since 2.8.0
	 *
	 * @param {object} form selector.
	 */
	constructor( form ) {
		this.form = form;
		this.jQueryForm = jQuery( form );
		this.ajaxurl = Give.fn.getGlobalVar( 'ajaxurl' );
	}

	/**
	 * Render PayPal smart buttons.
	 *
	 * @since 2.8.0
	 */
	boot() {
		jQuery( document ).on( 'give_gateway_loaded', { self: this }, this.onGatewayLoadBoot );

		if ( DonationForm.isPayPalCommerceSelected( this.jQueryForm ) ) {
			this.renderSmartButtons();
		}
	}

	/**
	 * Render paypal buttons when reload payment gateways.
	 *
	 * @since 2.8.0
	 *
	 * @param {object} evt
	 * @param {*} response
	 * @param {string} formIdAttr
	 */
	onGatewayLoadBoot( evt, response, formIdAttr ) {
		const self = evt.data.self;
		if ( formIdAttr === self.form.getAttribute( 'id' ) && DonationForm.isPayPalCommerceSelected( self.jQueryForm ) ) {
			self.renderSmartButtons();
		}
	}

	/**
	 * Render smart buttons.
	 *
	 * @since 2.8.0
	 */
	renderSmartButtons() {
		paypal.Buttons( {
			onInit: this.onInitHandler,
			onClick: this.onClickHandler,
			createOrder: this.createOrderHandler,
			onApprove: this.onApproveHandler,
		} ).render( this.form.querySelector( '#give-paypal-smart-buttons-wrap div' ) );
	}

	/**
	 * On init event handler for smart buttons.
	 *
	 * @since 2.8.0
	 *
	 * @param {object} data
	 * @param {object} actions
	 * @return {Promise<unknown>}
	 */
	onInitHandler( data, actions ) {
		actions.disable();
	}

	/**
	 * On click event handler for smart buttons.
	 *
	 * @since 2.8.0
	 *
	 * @param {object} data
	 * @param {object} actions
	 * @return {Promise<unknown>}
	 */
	onClickHandler(data, actions) { // eslint-disable-line
		let timerId;
		this.jQueryForm.ajaxComplete( DonationForm.checkIfDonationFormValidAfterValidationAjaxComplete );
		jQuery( 'input[name="give-purchase"].give-submit', this.jQueryForm ).trigger( 'click' );

		return new Promise(
			( resolve ) => {
				if ( ! Give.form.fn.isDonationFormHtml5Valid( this.form ) ) {
					resolve( false );
				}

				timerId = window.setInterval(
					() => {
						const status = this.jQueryForm.attr( 'data-pc-form-valid' );

						console.log( 'got status in interval callback ', status );

						if ( '1' === status ) {
							resolve( true );
						} else if ( '0' === status ) {
							resolve( false );
						}
					},
					5000
				);
			} )
			.then( ( result ) => {
				console.log( 'promise resoled with ', result );

				window.clearInterval( timerId );
				this.jQueryForm.removeAttr( 'data-pc-form-valid' );
				this.jQueryForm.off( 'ajaxComplete', DonationForm.checkIfDonationFormValidAfterValidationAjaxComplete );

				if ( result ) {
					return actions.resolve();
				}

				console.log( 'fail' );
				return actions.reject();
			} );
	}

	/**
	 * Create order event handler for smart buttons.
	 *
	 * @since 2.8.0
	 *
	 * @param {object} data
	 * @param {object} actions
	 * @return {Promise<unknown>}
	 */
	createOrderHandler(data, actions) { // eslint-disable-line
		// eslint-disable-next-line
		return fetch(`${this.ajaxurl}?action=give_paypal_commerce_create_order`, {
			method: 'POST',
			body: DonationForm.getFormDataWithoutGiveActionField( this.form ),
		} ).then( function( res ) {
			return res.json();
		} ).then( function( res ) {
			return res.data.id;
		} );
	}

	/**
	 * On approve event handler for smart buttons.
	 *
	 * @since 2.8.0
	 *
	 * @param {object} data
	 * @param {object} actions
	 */
	onApproveHandler( data, actions ) {
		// eslint-disable-next-line
		return fetch(`${this.ajaxurl}?action=give_paypal_commerce_approve_order&order=` + data.orderID, {
			method: 'post',
		} ).then( function( res ) {
			return res.json();
		} ).then( function( res ) {
			// Three cases to handle:
			//   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
			//   (2) Other non-recoverable errors -> Show a failure message
			//   (3) Successful transaction -> Show a success / thank you message

			// Your server defines the structure of 'orderData', which may differ
			const errorDetail = Array.isArray( res.data.order.details ) && res.data.order.details[ 0 ],
				  orderData = res.data.order;

			if ( errorDetail && errorDetail.issue === 'INSTRUMENT_DECLINED' ) {
				// Recoverable state, see: "Handle Funding Failures"
				// https://developer.paypal.com/docs/checkout/integration-features/funding-failure/
				return actions.restart();
			}

			if ( errorDetail ) {
				let msg = 'Sorry, your transaction could not be processed.';
				if ( errorDetail.description ) {
					msg += '\n\n' + errorDetail.description;
				}
				if ( orderData.debug_id ) {
					msg += ' (' + orderData.debug_id + ')';
				}
				// Show a failure message
				return alert(msg); // eslint-disable-line
			}

			DonationForm.attachOrderIdToForm( this.form, orderData.id )
				.then( () => {
					this.form.submit();
				} );
		} );
	}
}

export default SmartButtons;
