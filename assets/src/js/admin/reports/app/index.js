// Reports page app

// Vendor dependencies
import moment from 'moment';
const { __ } = wp.i18n;

import './style.scss';

// Store related dependencies
import { StoreProvider } from '../store';
import { reducer } from '../store/reducer';

// Components
import PeriodSelector from '../components/period-selector';
import SettingsToggle from '../components/settings-toggle';
import Tabs from '../components/tabs';
import Routes from '../components/routes';

const App = () => {
	// Initial app state (available in component through useStoreValue)
	const initialState = {
		// Initial period range (defaults to the past week)
		period: {
			startDate: moment().hour( 0 ).subtract( 7, 'days' ),
			endDate: moment().hour( 23 ),
			range: 'week',
		},
		giveStatus: null,
		pageLoaded: false,
	};

	return (
		<StoreProvider initialState={ initialState } reducer={ reducer }>
			<div className="wrap give-settings-page" style={ { position: 'relative' } }>
				<div className="give-settings-header">
					<h1 className="wp-heading-inline">{ __( 'Reports', 'give' ) }</h1>
					<div className="givewp-filters">
						<PeriodSelector />
						<SettingsToggle />
					</div>
				</div>
				<Tabs />
				<Routes />
			</div>
		</StoreProvider>
	);
};
export default App;
