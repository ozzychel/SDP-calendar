// import React from 'react';
// import ReactDOM from 'react-dom';
// import axios from 'axios';
// import styled from 'styled-components';
// import moment from 'moment';
// moment.locale('en-au');

import Calendar from './components/Calendar.jsx';
import Guests from './components/Guests.jsx';
import BestDeals from './components/BestDeals.jsx';
import AllDeals from './components/AllDeals.jsx';
import getDataFromServer from './lib/getDataFromServer.js';
import getUpdatedDataFromServer from './lib/getUpdatedDataFromServer.js';
import { faCalendarAlt, faUserFriends } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

class App extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      calendarView: false,
      guestsView: false,
      currentHotel: [],
      today: moment(),
      checkIn: false,
      checkOut: false,
      msg: '',
      userConfig: {
        roomsNumber: 1,
        adultsNumber: 2,
        childrenNumber: 1
      }
    };
    this.getData = this.getData.bind(this);
    this.getUpdatedData = this.getUpdatedData.bind(this);
    this.calculateAvrgRate = this.calculateAvrgRate.bind(this);
    this.renderCalendar = this.renderCalendar.bind(this);
    this.changeCalendarView = this.changeCalendarView.bind(this);
    this.renderGuests = this.renderGuests.bind(this);
    this.changeGuestsView = this.changeGuestsView.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
    this.renderDate = this.renderDate.bind(this);
    this.displayNotAvailableMsg = this.displayNotAvailableMsg.bind(this);
    this.updateGuestPickerInfo = this.updateGuestPickerInfo.bind(this);
    this.getUpdatedDates = this.getUpdatedDates.bind(this);
  }

  componentDidMount () {
    this.getData({
      hotelId: 3,
      check_in: moment(this.state.today).format('YYYY-MM-DD'),
      check_out: moment(this.state.today).add(1, 'day').format('YYYY-MM-DD')
    });
  }

  getData (term) {
    const response = getDataFromServer(term);
    response.then((hotel) => {
      this.setState({
        currentHotel: hotel
      });
    });
  }

  getUpdatedData (config) {
    let query = {
      guestsNumber: config.guestsNumber,
      roomsNumber: config.roomsNumber,
      adultsNumber: config.adultsNumber,
      childrenNumber: config.childrenNumber,
      hotelId: this.state.currentHotel[0].hotel_id,
      check_in: !this.state.checkIn ? this.state.today.format('YYYY-MM-DD') : this.state.checkIn,
      check_out: !this.state.checkOut ? this.state.today.add(1, 'day').format('YYYY-MM-DD') : this.state.checkOut
    }
    getUpdatedDataFromServer(query, this.handleResponse);
  };

  getUpdatedDates ({ checkIn, checkOut }) {
    let query = {
      adultsNumber: this.state.userConfig.adultsNumber,
      childrenNumber: this.state.userConfig.childrenNumber,
      roomsNumber: this.state.userConfig.roomsNumber,
      guestsNumber: this.state.userConfig.adultsNumber + this.state.userConfig.childrenNumber,
      hotelId: this.state.currentHotel[0].hotel_id,
      check_in: checkIn,
      check_out: checkOut
    }
    this.setState({ checkIn, checkOut })
    getUpdatedDataFromServer(query, this.handleResponse);
  }

  handleResponse (hotel) {
    if (hotel[0]['err_msg']) {
      this.setState({ msg: hotel[0]['err_msg'] });
    } else {
      if (this.state.calendarView) {
        this.setState({
          currentHotel: hotel,
          calendarView: false,
          guestsView: !this.state.guestsView,
          msg: ''
        });
      } else {
        this.setState({
          currentHotel: hotel,
          guestsView: false,
          msg: ''
        });
      }
    }
  }

  displayNotAvailableMsg () {
    return this.state.msg.length ? this.state.msg : null;
  }

  updateGuestPickerInfo ({adultsNumber, childrenNumber, roomsNumber}) {
    this.setState({
      userConfig: { roomsNumber, adultsNumber, childrenNumber }
    });
  }

  calculateAvrgRate () {
    if (!this.state.currentHotel[0]) {
      return 'Loading...';
    } else {
      const prices = [];
      this.state.currentHotel[0].prices.forEach((elem) => {
        if (elem.price !== 0) prices.push(elem.price);
      });
      return `$${Math.min(...prices)} - $${Math.max(...prices)}`;
    }
  }

  changeCalendarView () {
    this.setState({
      calendarView: !this.state.calendarView
    });
  }

  renderDate (param, day) {
    return !param ? (<span>{moment().add(day, 'day').format('ddd')}, {moment().add(day, 'day').format('MM/DD/YYYY')}</span>) :
      (<span>{moment(param).format('ddd')}, {moment(param).format('MM/DD/YYYY')}</span>);
  }

  renderCalendarBasics () {
    return (
      <div>
        <PickerButton onClick={this.changeCalendarView}>
          <PickerButtonDiv color="green">
            <PickerButtonIcon><FontAwesomeIcon icon={faCalendarAlt}/></PickerButtonIcon>
            <PickerButtonField>
              <PickerButtonCheckIn>Check In</PickerButtonCheckIn>
              <PickerButtonDate>{this.renderDate(this.state.checkIn, 0)}</PickerButtonDate>
            </PickerButtonField>
          </PickerButtonDiv>
        </PickerButton>

        <PickerButton onClick={this.changeCalendarView}>
          <PickerButtonDiv color="red">
            <PickerButtonIcon><FontAwesomeIcon icon={faCalendarAlt}/></PickerButtonIcon>
            <PickerButtonField>
              <PickerButtonCheckIn>Check Out</PickerButtonCheckIn>
              <PickerButtonDate>{this.renderDate(this.state.checkOut, 1)}</PickerButtonDate>
            </PickerButtonField>
          </PickerButtonDiv>
        </PickerButton>
      </div>
    );
  }

  renderCalendarPortal () {
    return ReactDOM.createPortal(
      <Calendar
        getUpdatedDates={this.getUpdatedDates}
        calculateAvrgRate={this.calculateAvrgRate}
        displayNotAvailableMsg={this.displayNotAvailableMsg}
        changeCalendarView={this.changeCalendarView}
      />,
      document.getElementById('calendar'));
  }

  renderCalendar () {
    return !this.state.calendarView ? this.renderCalendarBasics() :
      (<div>{this.renderCalendarBasics()}{this.renderCalendarPortal()}</div>);
  }

  changeGuestsView () {
    this.setState({
      guestsView: !this.state.guestsView
    });
  }

  renderGuestsBasics () {
    return (
      <div>
        <Guest onClick={this.changeGuestsView}>
          <PickerButtonDiv color="grey">
            <PickerButtonIcon>
              <FontAwesomeIcon icon={faUserFriends}/>
            </PickerButtonIcon>
            <GuestPicker>
              <GuestPickerGuestsSpan>Guests
              </GuestPickerGuestsSpan>
              <GuestPickerGuestsConfig>
                <span>
                  <GuestPickerGuestsConfigInner>
                    {this.state.userConfig.roomsNumber}
                    {this.state.userConfig.roomsNumber > 1 ? ' rooms, ' : ' room, '}
                  </GuestPickerGuestsConfigInner>
                  <GuestPickerGuestsConfigInner>
                    {this.state.userConfig.adultsNumber}
                    {this.state.userConfig.adultsNumber > 1 ? ' adults, ' : ' adult, '}
                  </GuestPickerGuestsConfigInner>
                  <GuestPickerGuestsConfigInner>
                    {this.state.userConfig.childrenNumber}
                    {this.state.userConfig.childrenNumber > 1 ? ' children' : ' child'}
                  </GuestPickerGuestsConfigInner>
                </span>
              </GuestPickerGuestsConfig>
            </GuestPicker>
          </PickerButtonDiv>
        </Guest>
      </div>
    );
  }

  renderGuests () {
    if (!this.state.guestsView) {
      return this.renderGuestsBasics();
    }
    if (this.state.guestsView) {
      return (
        <div>
          {this.renderGuestsBasics()}
          {this.renderGuestsPortal()}
        </div>
      );
    }
  }

  renderGuestsPortal () {
    return ReactDOM.createPortal(
      <Guests
        getUpdatedData={this.getUpdatedData}
        changeGuestsView={this.changeGuestsView}
        updateGuestPickerInfo={this.updateGuestPickerInfo}
      />,
      document.getElementById('guests')
    );
  }

  render () {
    return (
      <MainWrapper>
        <AppWrapper>
          <HeaderWrapper>
            <HeaderTextDiv><HeaderText>6 people are viewing this hotel</HeaderText></HeaderTextDiv>
          </HeaderWrapper>
          <CalendarGuestsWrapper>
            <PickerWrapper>{this.renderCalendar()}</PickerWrapper>
            <GuestsWrapper>{this.renderGuests()}</GuestsWrapper>
          </CalendarGuestsWrapper>
          <DealsWrapper>
            <BestDeals
              currentHotel={this.state.currentHotel}
              userDates={{checkIn: this.state.checkIn, checkOut: this.state.checkOut}}
            />
            <AllDeals currentHotel={this.state.currentHotel}/>
          </DealsWrapper>
        </AppWrapper>
      </MainWrapper>
    );
  }
}

const AppWrapper = styled.div`
  background-color: lightblue;
  min-width: 395px;
  height: 478px;
  // height: auto;
  padding: 4px 16px 0;
  box-shadow: 0 2px 4px 0 rgba(0,0,0,.1);
  min-height: 430px;
  box-sizing: border-box;
  border-radius: 2px;
  background-color: #fff;
  border-width: 1px;
  border-style: solid;
  border-color: #e0e0e0;
  position: relative;
  z-index: 20;
  font-family: 'Poppins', sans-serif;
`;

const CalendarGuestsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0;
  height: auto;
`;

const PickerWrapper = styled.div`
  display: block;
  flex-direction: row;
`;

const PickerButton = styled.button`
  flex: 1 1 0%;
  display: inline-block;
  height: 100%;
  margin: 0 0 0 8px;
  cursor: pointer;
  outline: none;
  box-sizing: border-box;
  text-decoration: none;
  background: #fff;
  padding: 0;
  text-align: left;
  font-size: inherit;
  border: 1px solid #d6d6d6;
  border-radius: 3px;
  box-shadow: 0 1px 2px rgba(0,0,0,.1);
  width: 172.5px;
`;

const PickerButtonDiv = styled.div`
  &:before {
    content: ".";
    display: inline-block;
    vertical-align: middle;
    height: 42px;
    width:10px;
    ${(props) => {
    return props.color === 'green' ? 'background-color:#00a680; color:#00a680' :
      props.color === 'grey' ? 'background-color:grey; color:grey' :
        'background-color:#d91e18; color:#d91e18';
  }}
  }
  height: 100%;
  background: #fff;
  border: none;
  border-radius: 2px;
  box-sizing: border-box;
  white-space: nowrap;
  position: relative;
`;

const PickerButtonIcon = styled.span`
  &:before{
      display: inline-block;
      font-style: normal;
      font-weight: 400;
      font-variant: normal;
      font-size: inherit;
      line-height: 1;
      -webkit-font-smoothing: antialiased;
      speak: none;
      text-decoration: none;
  }
  font-size: 1.25em;
  color: #767676;
  vertical-align: middle;
  padding-left: 10px;
  padding-right: 5px;
`;

const PickerButtonField = styled.span`
  display: inline-block;
  vertical-align: middle;
  margin-top: 3px;
  padding: 0 6px;
  overflow: hidden;
  box-sizing: border-box;
  max-width: 100%;
`;

const PickerButtonCheckIn = styled.span`
  display: block;
  margin-bottom: 2px;
  font-size: .75em;
  line-height: normal;
  color: #4a4a4a;
`;

const PickerButtonDate = styled.span`
  display: block;
  font-size: .8125em;
  font-weight: 700;
  line-height: 20px;
`;

const DealsWrapper = styled.div`
  display: block;
`;

const GuestsWrapper = styled.div`
  height: 100%;
  vertical-align: top;
  white-space: normal;
  text-align: left;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  color: #000a12;
  margin-top: 10px;
`;

const Guest = styled.button`
  display: inline-block;
  width: 354px;
  height: 100%;
  margin: 0 0 0 8px;
  cursor: pointer;
  outline: none;
  box-sizing: border-box;
  text-decoration: none;
  background: #fff;
  padding: 0;
  text-align: left;
  font-size: inherit;
  border: 1px solid #d6d6d6;
  border-radius: 3px;
  box-shadow: 0 1px 2px rgba(0,0,0,.1);
`;

const GuestDiv = styled.div`
  height: 100%;
  background: #fff;
  border: none;
  border-radius: 2px;
  box-sizing: border-box;
  white-space: nowrap;
  position: relative;
`;

const GuestIcon = styled.span`
  display: none;
  margin: 0 0 0 4px;
  font-size: 1.25em;
  color: #767676;
  vertical-align: middle;
`;

const GuestPicker = styled.span`
  display: inline-block;
  vertical-align: middle;
  margin-top: 3px;
  padding: 0 6px;
  overflow: hidden;
  box-sizing: border-box;
  max-width: 100%;
`;

const GuestPickerGuestsSpan = styled.span`
  display: block;
  margin-bottom: 2px;
  font-size: .75em;
  line-height: normal;
  color: #4a4a4a;
`;

const GuestPickerGuestsConfig = styled.span`
  font-size: .8125em;
  font-weight: 700;
  line-height: 20px;
`;

const GuestPickerGuestsConfigInner = styled.span`
  font-size: 1em;
  font-weight: 700;
  line-height: 20px;
`;

const HeaderWrapper = styled.div`
  // height: 44px;
  margin-bottom: 8px;
  margin-top: 0px;
  font-size: 16px;
  line-height: 42px;
  font-weight: 700;
  text-align: center;
  white-space: normal;
  height: 30px;
`;

const HeaderTextDiv = styled.div`
  display: inline-block;
  // vertical-align: top;
  font-size: 15px;
  line-height: 26px;
  font-weight: 700;
  color: #d91e18;
  background: #fff;
  text-align: center;
  vertical-align: top;
  height: 27px;
`;

const HeaderText = styled.span`
  display: inline-block;
  vertical-align: middle;
  font-size: 15px;
  line-height: 26px;
  font-weight: 700;
  color: #d91e18;
  background: #fff;
  text-align: center;
`;

const MainWrapper = styled.div`
  position: relative;
  display: block;
  width: 419px;
  height: 507px;
  font-family: 'Poppins', sans-serif;
`;

export default App;
