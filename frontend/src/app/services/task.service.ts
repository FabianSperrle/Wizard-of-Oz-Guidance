import { Injectable } from '@angular/core';
import { UserRole } from './study/user-role.service';
import { Observable, of } from 'rxjs';
import { StudyConditionService } from './study-condition.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private _activeTask: StudyTask;
  private taskList: StudyTask[];

  constructor(private studyConditionService: StudyConditionService) {
    this.studyConditionService.studyCondition.subscribe(condition => {
      switch (condition) {
        case 'blue':
          this.taskList = blue;
          break;
        case 'yellow':
          this.taskList = yellow;
          break;
        case 'orange':
          this.taskList = orange;
          break;
        case 'purple':
          this.taskList = purple;
          break;
        case 'training':
          this.taskList = training;
          break;
        case 'training2':
          this.taskList = training2;
          break;
      }

      this.activeTask = this.taskList[0];
    })
  }

  public getTasks(role: UserRole): Observable<StudyTask[]> {
    return of(this.taskList);
  }

  get activeTask(): StudyTask {
    return this._activeTask;
  }

  set activeTask(value: StudyTask) {
    this._activeTask = value;
  }
}

export interface StudyTask {
  id: number;
  title: string;
  description: string;
  goal: string;
  complete?: boolean;
}

const blue = [
  {
    id: 0,
    title: 'Initial Exploration',
    description: 'Keep all cities where the minimum temperature never exceeds 25 degrees. Because you want to travel with limited luggage, exclude all cities where, within in any month, the temperature does not vary by more than 10 degrees.',
    goal: 'Exclude cities that do not match your criteria.'
  },
  {
    id: 1,
    title: 'First Constraints',
    description: 'As you start to eliminate some options, your friend Caleb tells you that he does not like fog or humidity. Only keep cities that have fog on less than 3% of days and do not exceed 80% of humidity.',
    goal: 'Exclude cities that do not match your criteria.'
  },
  {
    id: 2,
    title: 'Pow Pow?',
    description: 'Peter mentions that he would like a city where he can go ski at some point throughout the year. Pick the month in which most cities have snowfall and, in that month, exclude all cities that no longer fit the requirements',
    goal: 'Pick a month for your vacation and exclude cities that do not match your criteria.'
  },
  {
    id: 3,
    title: 'Making everybody happy',
    description: 'Maria is not super fond of the idea of heading to the snow and asks that you at least make sure that your target city suffers the least from wind and clouds.',
    goal: 'Narrow your options and finally pick a venue for your vacation!'
  },
];

const orange = [
  {
    id: 0,
    title: 'Initial Exploration',
    description: 'Keep all cities where the wind speed never exceeds 5kts. Even in cities where the wind is not as strong, you want to avoid winds coming from north-east (between 0 and 90 degrees) if they are stronger than 2kts. ',
    goal: 'Exclude cities that do not match your criteria.'
  },
  {
    id: 1,
    title: 'First Constraints',
    description: 'While you are not a huge fan of the rain, you do not love dry heat either. Only keep cities with less than 15% rainy days per month. Additionally, you decide not to fly to Africa this year.',
    goal: 'Exclude cities that do not match your criteria.'
  },
  {
    id: 2,
    title: 'Cold, colder, ...',
    description: 'Antonio tells you that he can only tolerate humidity above 50% if it is colder than 5 degrees. Pick the month which leaves most cities as potential targets and exclude all cities that no longer fit the requirements.',
    goal: 'Pick a month for your vacation and exclude cities that do not match your criteria.'
  },
  {
    id: 3,
    title: 'Making everybody happy',
    description: 'Finally, Amelia chimes in and mentions that she loves hiking in winter when it is cold and foggy. You can take amazing pictures once the sun finally comes through, then! Find the coldest city that is most likely to have fog in your selected month.',
    goal: 'Narrow your options and finally pick a venue for your vacation!'
  },
];

const yellow = [
  {
    id: 0,
    title: 'Initial Exploration',
    description: 'Keep all cities where the minimum temperature never exceeds 25 degrees, on average. Because you want to travel with limited luggage, exclude all cities where, within in any month, the temperature does not vary by more than 10 degrees.',
    goal: 'Exclude cities that do not match your criteria.'
  },
  {
    id: 1,
    title: 'First Constraints',
    description: 'While you are not a huge fan of the rain, you do not love dry heat either. Only keep cities with less than 15% rainy days per month. Additionally, you decide not to fly to Africa this year.',
    goal: 'Exclude cities that do not match your criteria.'
  },
  {
    id: 2,
    title: 'Cold, colder, ...',
    description: 'Antonio tells you that he can only tolerate humidity above 50% if it is colder than 5 degrees. Pick the month which leaves most cities as potential targets and exclude all cities that no longer fit the requirements. \n',
    goal: 'Pick a month for your vacation and exclude cities that do not match your criteria.'
  },
  {
    id: 3,
    title: 'Making everybody happy',
    description: 'Maria is not super fond of the idea of heading to the snow and asks that you at least make sure that your target city suffers the least from wind and clouds.',
    goal: 'Narrow your options and finally pick a venue for your vacation!'
  },
];

const purple = [
  {
    id: 0,
    title: 'Initial Exploration',
    description: 'Keep all cities where the wind speed never exceeds 5kts. Even in cities where the wind is not as strong, you want to avoid winds coming from north-east (between 0 and 90 degrees) if they are stronger than 2kts. ',
    goal: 'Exclude cities that do not match your criteria.'
  },
  {
    id: 1,
    title: 'First Constraints',
    description: 'As you start to eliminate some options, your friend Caleb tells you that he does not like fog or humidity. Only keep cities that have fog on less than 3% of days and do not exceed 80% of humidity.',
    goal: 'Exclude cities that do not match your criteria.'
  },
  {
    id: 2,
    title: 'Pow Pow?',
    description: 'Peter mentions that he would like a city where he can go ski at some point throughout the year. Pick the month in which most cities have snowfall and, in that month, exclude all cities that no longer fit the requirements',
    goal: 'Pick a month for your vacation and exclude cities that do not match your criteria.'
  },
  {
    id: 3,
    title: 'Making everybody happy',
    description: 'Finally, Amelia chimes in and mentions that she loves hiking in winter when it is cold and foggy. You can take amazing pictures once the sun finally comes through, then! Find the coldest city that is most likely to have fog in your selected month.',
    goal: 'Narrow your options and finally pick a venue for your vacation!'
  },
];

const training = [
  {
    id: 0,
    title: 'Initial Exploration',
    description: 'Exclude all cities that are not located in the Americas or in Africa.',
    goal: 'Exclude cities that do not match your criteria.'
  },
  {
    id: 1,
    title: 'First Constraints',
    description: 'In which month do the most of the remaining cities reach average temperatures of above 30 degrees? Select that month and exclude all cities that stay below 20 degrees in that month.',
    goal: 'Pick a month and exclude cities that do not match your criteria.'
  },
  {
    id: 2,
    title: 'More constraints',
    description: 'Switch the color scale to humidity. Then, keep only those cities that have both rainy and foggy days in your selected month.',
    goal: 'Pick a month and exclude cities that do not match your criteria.'
  },
  {
    id: 3,
    title: 'Picking a solution',
    description: 'Of the selected cities, which receives the most wind and storms.',
    goal: 'Narrow your options and finally pick a venue for your vacation!'
  },
];

const training2 = [
  {
    id: 0,
    title: 'Initial Exploration',
    description: 'In January, find the continent in which, on average, cities reach the lowest temperatures. Remove that continent as well as the continent in which cities reach the highest temperatures',
    goal: 'Exclude two continents.'
  },
  {
    id: 1,
    title: 'Some Estimation',
    description: 'Find and remove all cities in which the temperature never exceeds 25 degrees.',
    goal: 'Remove cities that do not match your criteria.'
  },
  {
    id: 2,
    title: 'More constraints',
    description: 'Keep only cities from that continent in which, on average, cities receive the most rain throughout the year.',
    goal: 'Exclude all cities that do not match your criteria.'
  },
  {
    id: 3,
    title: 'Picking a solution',
    description: 'Of the remaining cities, which one gets the least wind and warmest temperatures throughout the year? Which city gets the most wind and the coldest temperatures, on average? ',
    goal: 'Identify the two cities that match your criteria.'
  },
];
