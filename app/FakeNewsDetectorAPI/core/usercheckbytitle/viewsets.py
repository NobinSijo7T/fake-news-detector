from rest_framework import viewsets
from rest_framework.response import Response
from .serializers import UserCheckSerializer
from core.model import load_models
from .meta_model import MetaNewsVerifier
import logging

logger = logging.getLogger(__name__)

class UserCheckViewSet(viewsets.ViewSet):
    """Viewset to handle user checking other news."""
    http_method_names = ('post', )
    serializer_class = UserCheckSerializer
    nb_model, vect_model = load_models()
    meta_verifier = MetaNewsVerifier()

    def create(self, request):
        """Get's news from user and returns predicted value."""
        logger.info(f"Received request data: {request.data}")
        
        serializer = UserCheckSerializer(data=request.data)
        if serializer.is_valid():
            input_data = serializer.validated_data['user_news']
            use_meta_model = request.data.get('use_meta_model', False)
            
            # Convert string to boolean if needed
            if isinstance(use_meta_model, str):
                use_meta_model = use_meta_model.lower() in ('true', '1', 'yes')
            
            logger.info(f"Input: {input_data}, Use Meta Model: {use_meta_model} (type: {type(use_meta_model)})")
            
            if use_meta_model:
                # Use Meta 4 Scout + SerpAPI model
                logger.info("Using Meta 4 Scout + SerpAPI model")
                result = self.meta_verifier.verify_news(input_data)
                logger.info(f"Meta model result: {result}")
                return Response(result)
            else:
                # Use existing traditional ML model
                logger.info("Using traditional ML model")
                input_data_list = [input_data]
                vectorized_text = self.vect_model.transform(input_data_list)
                prediction = self.nb_model.predict(vectorized_text)
                prediction_bool = True if prediction[0] == 1 else False
                
                response_data = {'prediction': prediction_bool}
                logger.info(f"Traditional model result: {response_data}")
                return Response(response_data)
        else:
            logger.error(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=400)
