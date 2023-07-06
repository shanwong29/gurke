import { StepDefinitions } from "jest-cucumber";
import { queue } from "../utils/configuration/queue";
import { testDataStorage } from "../utils/test-data-storage";

export const sqsSteps: StepDefinitions = ({ given, then }) => {
  given(
    /environment variables are set as follows:/,
    (envList: { EnvKey: string; EnvValue: string }[]) => {
      envList.forEach(({ EnvKey, EnvValue }) => {
        process.env[EnvKey] = EnvValue;
      });
    }
  );

  given(
    /a (fifo|standard) queue with queue name variable "(.*)" exists/,
    async (queueType: "fifo" | "standard", queueVariableName: string) => {
      const isFifo = queueType === "fifo";
      // queueName needs to be unique here to avoid messages storing in the same queue in localstack
      process.env[queueVariableName] = `${testDataStorage.getTestCaseId()}-${
        process.env[queueVariableName]
      }`;
      await queue.createQueue(process.env[queueVariableName] as string, isFifo);
    }
  );

  given(
    /the following batch of queue messages has been sent to queue with queue name variable "(.*)":/,
    async (queueVariableName: string, listOfQueueMessages: string) => {
      await queue.createTestBatchMessagesInQueue(
        process.env[queueVariableName] as string,
        JSON.parse(listOfQueueMessages)
      );
    }
  );

  then(
    /queue with variable name "(.*)" should have "(.*)" (message|messages)/,
    async (queueNameVariable: string, numberOfMsg: string) => {
      const listOfMsgInQueue = await queue.getListOfMessageBodyInQueue(
        process.env[queueNameVariable]
      );
      expect(listOfMsgInQueue.length).toBe(Number(numberOfMsg));
    }
  );

  then(
    /queue with variable name "(.*)" should have message with following message Body:/,
    async (queueNameVariable: string, expectedMessageBody: string) => {
      const listOfMsgInQueue = await queue.getListOfMessageBodyInQueue(
        process.env[queueNameVariable]
      );

      const listOfParsedMsgBody = listOfMsgInQueue?.map((el) =>
        el ? JSON.parse(el) : el
      );

      expect(listOfParsedMsgBody).toContainEqual(
        JSON.parse(expectedMessageBody)
      );
    }
  );
};
